import os
import sys
import json
import io
import re

# Dynamically include .venv site-packages if running from global python
venv_site_packages = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../scan-questions/.venv/Lib/site-packages"))
if os.path.exists(venv_site_packages) and venv_site_packages not in sys.path:
    sys.path.insert(0, venv_site_packages)

# Ensure stdout uses UTF-8 on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import cv2  # type: ignore # pyrefly: ignore
import numpy as np  # type: ignore # pyrefly: ignore
from PIL import Image  # type: ignore # pyrefly: ignore

from paddleocr import PaddleOCR  # type: ignore # pyrefly: ignore
from vietocr.tool.predictor import Predictor  # type: ignore # pyrefly: ignore
from vietocr.tool.config import Cfg  # type: ignore # pyrefly: ignore

def get_box_y(b):
    pts = np.asarray(b)
    if pts.ndim >= 2:
        return float(np.min(pts[:, 1]))
    elif pts.ndim == 1 and len(pts) >= 2:
        return float(pts[1])
    return 0.0

def parse_lines_to_questions(lines):
    questions = []
    current_q = None

    clean_lines = [l.strip() for l in lines if l.strip()]

    i = 0
    while i < len(clean_lines):
        line = clean_lines[i]

        # Check for Question Header: "Câu 1", "CÂU 1", "1.", "Q1."
        is_q_header = bool(re.match(r'^(CÂU\s*HỎI|CÂU|Câu|\d+[\.\:]|\d+\s*\(.*?\))', line, re.IGNORECASE))
        # Check for Option Prefix: "A.", "B.", "C.", "D.", "A)", "a.", "A ", "B "
        opt_match = re.match(r'^(?:[\[\(]?([A-Da-d])[\]\.\:\-\s])\s*(.*)$', line)

        if is_q_header or (current_q is None and not opt_match):
            if current_q:
                questions.append(current_q)
            
            # Clean header prefix if present (e.g. remove "Câu 1:" if desired, or keep)
            current_q = {
                "question": line,
                "options": [],
                "type": "SINGLE_CHOICE",
                "answer": "",
                "explanation": ""
            }
            i += 1
            # Accumulate multi-line question text until hitting "?" / ":" or an Option prefix
            while i < len(clean_lines):
                next_line = clean_lines[i]
                next_opt_match = re.match(r'^(?:[\[\(]?([A-Da-d])[\]\.\:\-\s])\s*(.*)$', next_line)
                next_header = bool(re.match(r'^(CÂU\s*HỎI|CÂU|Câu|\d+[\.\:])', next_line, re.IGNORECASE))
                
                if next_opt_match or next_header:
                    break
                
                current_q["question"] += " " + next_line
                i += 1
                if next_line.endswith("?") or next_line.endswith(":"):
                    break
            continue

        if opt_match and current_q:
            opt_letter = opt_match.group(1).upper()
            opt_text = opt_match.group(2).strip() if opt_match.group(2) else ""
            formatted_option = f"{opt_letter}. {opt_text}".strip()
            current_q["options"].append(formatted_option)
            i += 1
            continue

        # Fallback if line has no option prefix (e.g. OCR missed C. or D. prefix)
        if current_q:
            if len(current_q["options"]) > 0:
                # Infer next expected letter (A -> B -> C -> D)
                existing_letters = [opt[0] for opt in current_q["options"] if len(opt) > 0 and opt[0] in ['A', 'B', 'C', 'D']]
                expected_next = None
                for candidate in ['A', 'B', 'C', 'D']:
                    if candidate not in existing_letters:
                        expected_next = candidate
                        break
                
                if expected_next:
                    current_q["options"].append(f"{expected_next}. {line}")
                else:
                    current_q["options"][-1] += " " + line
            else:
                current_q["question"] += " " + line

        i += 1

    if current_q:
        questions.append(current_q)

    return questions

def run_ocr_cli(img_path):
    if not os.path.exists(img_path):
        print(json.dumps({"error": f"Image file not found: {img_path}"}, ensure_ascii=False))
        sys.exit(1)

    img_bgr = cv2.imread(img_path)
    if img_bgr is None:
        print(json.dumps({"error": f"Cannot load image file: {img_path}"}, ensure_ascii=False))
        sys.exit(1)

    h_img, w_img = img_bgr.shape[:2]

    # Auto-resize large images to max 1600px width/height for 3x faster detection
    max_dim = 1600
    if max(h_img, w_img) > max_dim:
        scale = max_dim / float(max(h_img, w_img))
        img_bgr = cv2.resize(img_bgr, (int(w_img * scale), int(h_img * scale)), interpolation=cv2.INTER_AREA)
        h_img, w_img = img_bgr.shape[:2]

    # Temporary resize save for PaddleOCR detection
    temp_resized_path = img_path + "_resized.png"
    cv2.imwrite(temp_resized_path, img_bgr)

    try:
        # PaddleOCR Text Detection
        detector_ocr = PaddleOCR(lang='en')
        det_results = detector_ocr.ocr(temp_resized_path)
    finally:
        if os.path.exists(temp_resized_path):
            try:
                os.remove(temp_resized_path)
            except Exception:
                pass

    boxes = []
    if det_results:
        for item in det_results:
            if isinstance(item, dict) and 'dt_polys' in item:
                for poly in item['dt_polys']:
                    boxes.append(poly)
            elif isinstance(item, list):
                for line in item:
                    if isinstance(line, (list, tuple)) and len(line) > 0:
                        boxes.append(line[0])

    boxes = sorted(boxes, key=get_box_y)

    # VietOCR Predictor
    config = Cfg.load_config_from_name('vgg_transformer')
    config['device'] = 'cpu'
    config['predictor']['beamsearch'] = False
    vietocr_predictor = Predictor(config)

    crop_pil_imgs = []
    for poly in boxes:
        pts = np.asarray(poly, dtype=np.int32)
        if pts.ndim >= 2:
            x_min = max(0, int(np.min(pts[:, 0])))
            x_max = min(w_img, int(np.max(pts[:, 0])))
            y_min = max(0, int(np.min(pts[:, 1])))
            y_max = min(h_img, int(np.max(pts[:, 1])))
        elif pts.ndim == 1 and len(pts) >= 4:
            x_min, y_min, x_max, y_max = pts[0], pts[1], pts[2], pts[3]
        else:
            continue

        pad = 2
        crop_ymin = max(0, y_min - pad)
        crop_ymax = min(h_img, y_max + pad)
        crop_xmin = max(0, x_min - pad)
        crop_xmax = min(w_img, x_max + pad)

        crop_bgr = img_bgr[crop_ymin:crop_ymax, crop_xmin:crop_xmax]
        if crop_bgr.size == 0:
            continue

        crop_rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
        crop_pil_imgs.append(Image.fromarray(crop_rgb))

    # Fast Batch Prediction with VietOCR!
    recognized_lines = []
    if crop_pil_imgs:
        batch_results = vietocr_predictor.predict_batch(crop_pil_imgs)
        recognized_lines = [text.strip() for text in batch_results if text and text.strip()]

    parsed_questions = parse_lines_to_questions(recognized_lines)
    print(json.dumps({"success": True, "questions": parsed_questions}, ensure_ascii=False))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing image path argument"}, ensure_ascii=False))
        sys.exit(1)

    img_path_arg = os.path.abspath(sys.argv[1])
    run_ocr_cli(img_path_arg)

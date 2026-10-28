# Phân Công Nhiệm Vụ Bài Tập Lớn 1c
## Đề tài: Phân loại bình luận toxic và non-toxic trong các nhóm Facebook sinh viên PTIT

* **Quy mô nhóm:** 4 thành viên
* **Phương pháp gán nhãn:** Bán tự động (AI/LLM hỗ trợ điền nhãn sơ bộ + 4 thành viên kiểm duyệt và hoàn thiện)
* **Quy ước nhãn:**
  * `0` — **Non-toxic:** Trao đổi bình thường, hỏi đáp, phê bình/góp ý chính sách, dịch vụ trường lớp không có yếu tố xúc phạm, mạ lỵ cá nhân/tập thể.
  * `1` — **Toxic:** Lăng mạ, sỉ nhục, quấy rối, đe dọa, xúc phạm danh dự cá nhân hoặc nhóm người.

---

## 👤 Người 1: Data & Preprocessing Lead
*(Phụ trách thu thập, làm sạch, audit dữ liệu và module tiền xử lý)*

### Các đầu việc chính:
1. **Gán nhãn & Kiểm duyệt dữ liệu:**
   * Chạy script AI tự động điền nhãn `0`/`1` và lý do cho toàn bộ 2.314 dòng bình luận.
   * Rà soát nhanh lại các câu nghi ngờ hoặc câu máy gán nhãn `1` trong file `annotations/thanh_vien_1.csv` (579 câu).
2. **Xử lý & Chuẩn hóa dữ liệu:**
   * Viết script `audit_data.py`: Gộp 4 file `thanh_vien_*.csv` thành bộ dữ liệu hoàn chỉnh, kiểm tra tính toàn vẹn (không trùng ID, không còn nhãn trống, lọc bỏ nhiễu/lỗi).
   * Viết script `make_splits.py`: Chia tập dữ liệu thành **Train (70%) - Validation (15%) - Test (15%) theo nguyên bài viết (`post_id`)** để triệt tiêu hiện tượng rò rỉ dữ liệu (data leakage).
   * Xây dựng module tiền xử lý văn bản dùng chung `src/preprocessing.py`: Chuẩn hóa Unicode NFC, xử lý khoảng trắng, bảo toàn dấu tiếng Việt, tách từ ghép (`pyvi` hoặc `underthesea`) để Người 2 và Người 3 nạp vào mô hình.

### Sản phẩm bàn giao:
* `scripts/audit_data.py`
* `scripts/make_splits.py` (và thư mục `data/splits/` gồm `train.csv`, `val.csv`, `test.csv`)
* Module tiền xử lý `src/preprocessing.py`

---

## 👤 Người 2: Machine Learning Baseline Lead
*(Phụ trách các mô hình học máy truyền thống)*

### Các đầu việc chính:
1. **Kiểm duyệt dữ liệu:**
   * Rà soát nhanh các câu nhãn `1` hoặc câu khó trong file `annotations/thanh_vien_2.csv` (579 câu).
2. **Trích xuất đặc trưng văn bản:**
   * Cài đặt 2 phương pháp biểu diễn đặc trưng:
     * **Bag-of-Words (BoW):** Dùng `CountVectorizer` của scikit-learn.
     * **TF-IDF:** Dùng `TfidfVectorizer` của scikit-learn.
3. **Huấn luyện mô hình:**
   * Xây dựng pipeline scikit-learn huấn luyện 4 tổ hợp mô hình:
     1. BoW + Multinomial Naive Bayes (`MultinomialNB`)
     2. BoW + Linear SVM (`LinearSVC`)
     3. TF-IDF + Multinomial Naive Bayes (`MultinomialNB`)
     4. TF-IDF + Linear SVM (`LinearSVC`)
     *(Bổ sung 1 mô hình đối chứng `DummyClassifier` luôn đoán lớp đa số)*.
   * Tinh chỉnh siêu tham số trên tập Validation (các giá trị `alpha`, `C`, `ngram_range`).
   * Lưu các file mô hình tốt nhất (`.joblib`) vào thư mục `models/`.
   * Xuất bảng kết quả và log thực nghiệm của Baseline bàn giao cho Người 4.

### Sản phẩm bàn giao:
* `scripts/train_baselines.py`
* Thư mục `models/` chứa các file pipeline Baseline `.joblib`
* File bảng số liệu `results/baseline_metrics.csv`

---

## 👤 Người 3: Deep Learning PhoBERT Lead
*(Phụ trách mô hình ngôn ngữ ngữ cảnh hiện đại)*

### Các đầu việc chính:
1. **Kiểm duyệt dữ liệu:**
   * Rà soát nhanh các câu nhãn `1` hoặc câu khó trong file `annotations/thanh_vien_3.csv` (578 câu).
2. **Thiết lập & Huấn luyện PhoBERT:**
   * Thiết lập môi trường PyTorch + Transformers trên máy có GPU (hoặc tạo notebook trên Google Colab / Kaggle).
   * Xây dựng Dataset, DataLoader và Tokenizer cho `vinai/phobert-base`.
   * Viết pipeline fine-tune PhoBERT với đầu phân loại 2 lớp (Toxic / Non-toxic).
   * Theo dõi loss và validation metric qua từng epoch, lưu lại checkpoint mô hình đạt Macro-F1 cao nhất trên tập Validation.
   * Đo đạc thời gian huấn luyện và xuất file log kết quả chi tiết bàn giao cho Người 4.

### Sản phẩm bàn giao:
* `scripts/train_phobert.py` (hoặc `notebooks/train_phobert.ipynb`)
* Thư mục checkpoint mô hình PhoBERT tốt nhất (`models/phobert_best/`)
* File bảng số liệu `results/phobert_metrics.csv`

---

## 👤 Người 4: Evaluation, Visualization & Report Lead
*(Phụ trách đánh giá mô hình, trực quan hóa so sánh để đưa vào báo cáo và chủ trì viết Báo cáo BTL)*

### Các đầu việc chính:
1. **Kiểm duyệt dữ liệu:**
   * Rà soát file `annotations/thanh_vien_4.csv` (578 câu); cùng nhóm rà soát kỹ các câu thuộc tập Test độc lập.
2. **Đánh giá & So sánh mô hình:**
   * Viết script `evaluate_models.py`: Nạp tất cả mô hình đã huấn luyện (4 Baseline từ Người 2 + PhoBERT từ Người 3) để chấm điểm trên cùng tập Test.
   * Tính toán bộ chỉ số cốt lõi: **Accuracy, Precision, Recall, F1 toxic, Macro-F1**.
   * Lập **Bảng so sánh tổng hợp đối đầu** giữa các phương pháp trích chọn đặc trưng (BoW vs TF-IDF) và thuật toán (Naive Bayes vs SVM vs PhoBERT).
   * Lọc các câu đoán sai (False Positive, False Negative) để làm bảng **Phân tích lỗi (Error Analysis)**.
3. **Xây dựng Dashboard Trực quan hóa (Visualization Dashboard):**
   * Xây dựng giao diện trực quan hóa gọn nhẹ (bằng Streamlit hoặc script xuất ảnh `results/`): Mục đích chính là **sinh ra các biểu đồ và bảng số liệu chuẩn đẹp để chụp ảnh/dán thẳng vào Báo cáo**:
     * **Trực quan hóa dữ liệu:** Biểu đồ tròn tỷ lệ nhãn Toxic/Non-toxic, biểu đồ phân bố bình luận theo bài viết.
     * **Trực quan hóa so sánh mô hình:** Biểu đồ cột so sánh Macro-F1 và F1-toxic giữa 5 mô hình (thấy rõ sự khác biệt giữa BoW vs TF-IDF, SVM vs NB, Baseline vs PhoBERT).
     * **Ma trận nhầm lẫn:** Heatmap Confusion Matrix của từng mô hình (hiển thị rõ số lượng TP, FP, TN, FN).
     * *(Phụ trợ)*: Có một ô nhập text nhanh để test dự đoán tại chỗ nếu giảng viên yêu cầu demo.
4. **Chủ trì biên soạn Báo cáo BTL & Slide:**
   * Viết file Báo cáo BTL (Word / PDF) hoàn chỉnh:
     * **Chương 1:** Đặt vấn đề, bối cảnh Facebook PTIT, bài toán và định nghĩa nhãn.
     * **Chương 2:** Cơ sở lý thuyết (BoW, TF-IDF, Naive Bayes, Linear SVM, PhoBERT, các chỉ số P/R/F1).
     * **Chương 3:** Thực nghiệm (mô tả dữ liệu, bảng so sánh kết quả 5 mô hình, chèn các biểu đồ và ma trận nhầm lẫn từ Dashboard, phân tích lỗi sai thực tế).
     * **Chương 4:** Kết luận, các hạn chế và hướng phát triển tương lai.
   * Thiết kế Slide thuyết trình (8–12 slide tóm tắt các điểm nổi bật của đề tài).

### Sản phẩm bàn giao:
* `scripts/evaluate_models.py`
* Dashboard trực quan hóa `app.py` (hoặc bộ script sinh biểu đồ tự động)
* Thư mục `results/` (chứa các file ảnh biểu đồ PNG độ nét cao, `confusion_matrix_*.png`, `error_analysis.csv`)
* **File Báo cáo BTL hoàn chỉnh (Word / PDF)**
* **File Slide thuyết trình (PowerPoint / PDF)**

---

## Sơ đồ luồng phối hợp (Workflow)

```text
[2.314 comment thô]
        │
        ▼ (AI gán nhãn tự động + 4 thành viên review nhanh)
[Tập nhãn hoàn chỉnh] 
        │
        ▼ (Người 1 audit & chia tập theo post_id)
 ┌──────┴──────────────────────┐
 │ Train (70%) + Val (15%)     │ Test (15% độc lập)
 └──────┬──────────────────────┘        │
        ├────────────────────────┐      │
        ▼                        ▼      ▼
 [Người 2: 4 Baseline]    [Người 3: PhoBERT]
        │                        │
        └───────────┬────────────┘
                    ▼
           [Người 4: Nhận models để Đánh giá & Phân tích lỗi trên tập Test]
                    │
           ┌────────┴───────────────────────────┐
           ▼                                    ▼
 [Người 4: Dựng Demo Dashboard]     [Người 4: Viết Báo cáo BTL & Slide]
 (Chart, Benchmark, Live test,...)   (Tổng hợp toàn bộ kết quả của nhóm)
```

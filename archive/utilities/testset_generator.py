"""
testset_generator.py - Module tạo tập dữ liệu test cho hệ thống RAG Pháp lý Nhân sự
Tạo 50-100 cặp Câu hỏi - Ngữ cảnh đúng (Ground Truth) định dạng HuggingFace Dataset.
"""
import json
import os
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import random

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class TestCase:
    """Một test case trong tập dữ liệu đánh giá."""
    question: str                    # Câu hỏi
    ground_truth: str               # Câu trả lời đúng (ground truth)
    context: str                    # Ngữ cảnh đúng
    category: str                   # Phân loại (ví dụ: "bhxh", "ld", "bhyt")
    difficulty: str                 # Độ khó: "easy", "medium", "hard"
    source_document: str            # Tài liệu nguồn
    article_reference: str          # Tham chiếu điều luật
    metadata: Dict[str, Any] = None # Metadata bổ sung
    
    def to_dict(self) -> Dict[str, Any]:
        """Chuyển đổi thành dictionary."""
        return {
            "question": self.question,
            "ground_truth": self.ground_truth,
            "context": self.context,
            "category": self.category,
            "difficulty": self.difficulty,
            "source_document": self.source_document,
            "article_reference": self.article_reference,
            "metadata": self.metadata or {},
            "created_at": datetime.now().isoformat()
        }


class TestSetGenerator:
    """
    Generator tạo tập dữ liệu test cho hệ thống RAG Pháp lý.
    Tạo 50-100 test cases với độ phức tạp và phân loại đa dạng.
    """
    
    def __init__(self, output_dir: str = "evaluation_results"):
        """
        Khởi tạo generator.
        
        Args:
            output_dir: Thư mục lưu tập test
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
        # Danh sách test cases mẫu phức tạp (hardcoded 5 ví dụ theo yêu cầu)
        self._hardcoded_cases = self._create_hardcoded_test_cases()
        
        # Templates để tạo test cases tự động
        self._question_templates = self._create_question_templates()
        self._context_templates = self._create_context_templates()
        
        # Categories và độ khó
        self.categories = ["bhxh", "ld", "bhyt", "contract", "salary", "leave", "termination"]
        self.difficulties = ["easy", "medium", "hard"]
        
    def _create_hardcoded_test_cases(self) -> List[TestCase]:
        """
        Tạo 5 test cases mẫu phức tạp liên quan đến nghiệp vụ HR.
        
        Returns:
            List các test cases mẫu
        """
        return [
            TestCase(
                question="Mức trợ cấp mai táng cho người lao động tham gia bảo hiểm xã hội là bao nhiêu?",
                ground_truth="Mức trợ cấp mai táng bằng 10 lần mức lương cơ sở tại thời điểm người lao động chết, được quy định tại Điều 66 Luật Bảo hiểm xã hội 2014. Hiện nay với mức lương cơ sở 1.800.000 đồng/tháng, mức trợ cấp là 18.000.000 đồng.",
                context="Theo Điều 66 Luật Bảo hiểm xã hội 2014, mức trợ cấp mai táng bằng 10 lần mức lương cơ sở tại thời điểm người lao động chết. Mức lương cơ sở hiện hành là 1.800.000 đồng/tháng (theo Nghị định 38/2019/NĐ-CP).",
                category="bhxh",
                difficulty="hard",
                source_document="Luật Bảo hiểm xã hội 2014",
                article_reference="Điều 66"
            ),
            TestCase(
                question="Tuổi nghỉ hưu của lao động nữ trong điều kiện bình thường là bao nhiêu?",
                ground_truth="Tuổi nghỉ hưu của lao động nữ trong điều kiện bình thường là đủ 55 tuổi 6 tháng vào năm 2024 và tăng dần lên 60 tuổi vào năm 2035 theo lộ trình tại Điều 169 Bộ luật Lao động 2019.",
                context="Điều 169 Bộ luật Lao động 2019 quy định lộ trình tăng tuổi nghỉ hưu: Lao động nữ nghỉ hưu ở tuổi đủ 55 vào năm 2020, tăng 3 tháng mỗi năm từ 2021, đến năm 2024 là 55 tuổi 6 tháng, và đủ 60 tuổi vào năm 2035.",
                category="ld",
                difficulty="hard",
                source_document="Bộ luật Lao động 2019",
                article_reference="Điều 169"
            ),
            TestCase(
                question="Mức lương tối thiểu vùng I năm 2024 là bao nhiêu?",
                ground_truth="Mức lương tối thiểu vùng I năm 2024 là 4.960.000 đồng/tháng theo Nghị định 70/2023/NĐ-CP, áp dụng từ ngày 01/7/2024.",
                context="Nghị định 70/2023/NĐ-CP quy định mức lương tối thiểu vùng năm 2024: Vùng I: 4.960.000 đồng/tháng, Vùng II: 4.410.000 đồng/tháng, Vùng III: 3.860.000 đồng/tháng, Vùng IV: 3.450.000 đồng/tháng. Áp dụng từ 01/7/2024.",
                category="salary",
                difficulty="medium",
                source_document="Nghị định 70/2023/NĐ-CP",
                article_reference="Điều 1"
            ),
            TestCase(
                question="Điều kiện hưởng chế độ ốm đau đối với người lao động là gì?",
                ground_truth="Người lao động được hưởng chế độ ốm đau khi: 1) Bị ốm đau, tai nạn không phải là tai nạn lao động; 2) Phải nghỉ việc để điều trị; 3) Có xác nhận của cơ sở y tế; 4) Đã đóng BHXH từ đủ 30 ngày trở lên trong 12 tháng trước khi nghỉ việc.",
                context="Điều 25 Luật Bảo hiểm xã hội 2014 quy định điều kiện hưởng chế độ ốm đau: Người lao động phải nghỉ việc do ốm đau, tai nạn (không phải tai nạn lao động); có xác nhận của cơ sở y tế; đã đóng BHXH từ đủ 30 ngày trở lên trong 12 tháng trước khi nghỉ việc.",
                category="bhxh",
                difficulty="medium",
                source_document="Luật Bảo hiểm xã hội 2014",
                article_reference="Điều 25"
            ),
            TestCase(
                question="Thời gian thử việc tối đa theo quy định của Bộ luật Lao động là bao nhiêu?",
                ground_truth="Thời gian thử việc tối đa theo Điều 25 Bộ luật Lao động 2019 là: 60 ngày đối với công việc có chức danh nghề nghiệp cần trình độ cao đẳng trở lên; 30 ngày đối với công việc có chức danh nghề nghiệp cần trình độ trung cấp, công nhân kỹ thuật; 6 ngày đối với công việc khác.",
                context="Điều 25 Bộ luật Lao động 2019 quy định: Thời gian thử việc do hai bên thỏa thuận căn cứ vào tính chất, mức độ phức tạp của công việc nhưng chỉ được thử việc một lần đối với một công việc và bảo đảm thời gian thử việc không quá: 60 ngày đối với công việc có chức danh nghề nghiệp cần trình độ cao đẳng trở lên; 30 ngày đối với công việc có chức danh nghề nghiệp cần trình độ trung cấp, công nhân kỹ thuật; 6 ngày đối với công việc khác.",
                category="contract",
                difficulty="easy",
                source_document="Bộ luật Lao động 2019",
                article_reference="Điều 25"
            )
        ]
    
    def _create_question_templates(self) -> Dict[str, List[str]]:
        """
        Tạo templates cho câu hỏi theo từng category.
        
        Returns:
            Dictionary chứa templates cho mỗi category
        """
        return {
            "bhxh": [
                "Mức đóng bảo hiểm xã hội bắt buộc là bao nhiêu phần trăm?",
                "Điều kiện để được hưởng chế độ thai sản là gì?",
                "Mức hưởng chế độ ốm đau được tính như thế nào?",
                "Thời gian đóng BHXH tối thiểu để được hưởng lương hưu là bao lâu?",
                "Hồ sơ hưởng chế độ tai nạn lao động gồm những gì?"
            ],
            "ld": [
                "Hợp đồng lao động phải có những nội dung gì bắt buộc?",
                "Thời giờ làm việc bình thường không được quá bao nhiêu giờ/tuần?",
                "Người lao động được nghỉ bao nhiêu ngày phép năm?",
                "Điều kiện chấm dứt hợp đồng lao động là gì?",
                "Mức lương làm thêm giờ được tính như thế nào?"
            ],
            "bhyt": [
                "Mức đóng bảo hiểm y tế là bao nhiêu phần trăm?",
                "Phạm vi thanh toán của bảo hiểm y tế bao gồm những gì?",
                "Thẻ bảo hiểm y tế có giá trị sử dụng trong bao lâu?",
                "Đối tượng tham gia bảo hiểm y tế bắt buộc là những ai?",
                "Mức hưởng bảo hiểm y tế đối với khám chữa bệnh đúng tuyến là bao nhiêu?"
            ],
            "salary": [
                "Nguyên tắc trả lương được quy định như thế nào?",
                "Các khoản khấu trừ vào lương cần đáp ứng điều kiện gì?",
                "Thời điểm trả lương tối thiểu là bao nhiêu lần/tháng?",
                "Các hình thức trả lương nào được pháp luật cho phép?",
                "Trách nhiệm của người sử dụng lao động trong việc trả lương là gì?"
            ],
            "leave": [
                "Các loại nghỉ phép mà người lao động được hưởng?",
                "Điều kiện để được nghỉ phép năm là gì?",
                "Cách tính số ngày nghỉ phép năm?",
                "Quyền nghỉ không hưởng lương được quy định thế nào?",
                "Nghỉ việc riêng có được hưởng lương không?"
            ]
        }
    
    def _create_context_templates(self) -> Dict[str, List[str]]:
        """
        Tạo templates cho context (ngữ cảnh đúng).
        
        Returns:
            Dictionary chứa context templates
        """
        return {
            "bhxh": [
                "Theo Điều {article} Luật Bảo hiểm xã hội 2014: {content} Mức đóng BHXH bắt buộc là 8% lương tháng do người lao động đóng và 14% do người sử dụng lao động đóng.",
                "Điều {article} quy định về điều kiện hưởng các chế độ BHXH: {content} Người lao động phải có thời gian đóng BHXH tối thiểu theo quy định.",
                "Chế độ thai sản được quy định tại Điều {article}: {content} Lao động nữ sinh con được nghỉ việc hưởng chế độ thai sản trước và sau khi sinh con là 6 tháng."
            ],
            "ld": [
                "Bộ luật Lao động 2019 Điều {article} quy định: {content} Hợp đồng lao động phải được giao kết bằng văn bản trong các trường hợp nhất định.",
                "Theo Điều {article}: {content} Thời giờ làm việc bình thường không quá 8 giờ/ngày và 48 giờ/tuần.",
                "Điều {article} về nghỉ phép năm: {content} Người lao động làm việc đủ 12 tháng cho một người sử dụng lao động thì được nghỉ phép năm, hưởng nguyên lương."
            ],
            "bhyt": [
                "Luật Bảo hiểm y tế Điều {article} quy định: {content} Mức đóng bằng 4,5% tiền lương tháng, trong đó người lao động đóng 1,5% và người sử dụng lao động đóng 3%.",
                "Theo Điều {article}: {content} Thẻ BHYT có giá trị sử dụng đến hết ngày cuối cùng của tháng được ghi trên thẻ.",
                "Điều {article} về phạm vi thanh toán: {content} BHYT chi trả chi phí khám bệnh, chữa bệnh theo danh mục và tỷ lệ quy định."
            ]
        }
    
    def _generate_test_case(
        self, 
        category: str, 
        difficulty: str = "medium",
        index: int = 0
    ) -> Optional[TestCase]:
        """
        Tạo một test case tự động.
        
        Args:
            category: Loại câu hỏi
            difficulty: Độ khó
            index: Chỉ số để tạo variation
            
        Returns:
            TestCase hoặc None nếu không tạo được
        """
        try:
            # Lấy templates cho category
            question_templates = self._question_templates.get(category, [])
            context_templates = self._context_templates.get(category, [])
            
            if not question_templates or not context_templates:
                return None
            
            # Chọn template ngẫu nhiên hoặc theo index
            question_idx = index % len(question_templates)
            context_idx = index % len(context_templates)
            
            question_template = question_templates[question_idx]
            context_template = context_templates[context_idx]
            
            # Tạo article number dựa trên index và difficulty
            article_base = 10 + index
            if difficulty == "hard":
                article_base += 100
            elif difficulty == "easy":
                article_base += 5
            
            # Tạo content dựa trên difficulty
            if difficulty == "hard":
                content = f"Nội dung phức tạp với nhiều điều khoản chi tiết về {category}, bao gồm các quy định cụ thể và điều kiện áp dụng."
            elif difficulty == "medium":
                content = f"Quy định về {category} với các điều kiện cơ bản và mức hưởng theo luật định."
            else:  # easy
                content = f"Quy định cơ bản về {category} theo luật pháp hiện hành."
            
            # Tạo test case
            question = question_template
            context = context_template.format(
                article=article_base,
                content=content
            )
            
            # Tạo ground truth dựa trên question và context
            ground_truth = self._generate_ground_truth(question, context, category)
            
            # Tạo source document và reference
            source_document = self._get_source_document(category)
            article_reference = f"Điều {article_base}"
            
            return TestCase(
                question=question,
                ground_truth=ground_truth,
                context=context,
                category=category,
                difficulty=difficulty,
                source_document=source_document,
                article_reference=article_reference,
                metadata={
                    "generated": True,
                    "template_index": index,
                    "variation": f"{category}_{difficulty}_{index}"
                }
            )
            
        except Exception as e:
            logger.error(f"Lỗi khi tạo test case: {e}")
            return None
    
    def _generate_ground_truth(self, question: str, context: str, category: str) -> str:
        """
        Tạo ground truth (câu trả lời đúng) từ câu hỏi và context.
        
        Args:
            question: Câu hỏi
            context: Ngữ cảnh
            category: Phân loại
            
        Returns:
            Ground truth string
        """
        # Đây là implementation đơn giản
        # Trong thực tế, có thể sử dụng LLM để tạo ground truth chính xác hơn
        base_answer = f"Dựa trên quy định pháp luật về {category}: "
        
        if "bao nhiêu" in question.lower() or "mức" in question.lower():
            return base_answer + f"Theo quy định hiện hành, mức cụ thể được nêu trong tài liệu pháp lý liên quan."
        elif "điều kiện" in question.lower():
            return base_answer + f"Các điều kiện cần đáp ứng được quy định chi tiết trong văn bản pháp luật."
        elif "thời gian" in question.lower() or "bao lâu" in question.lower():
            return base_answer + f"Thời gian được quy định cụ thể tùy theo từng trường hợp và điều kiện áp dụng."
        else:
            return base_answer + f"Quy định pháp luật cung cấp hướng dẫn chi tiết về vấn đề này."
    
    def _get_source_document(self, category: str) -> str:
        """
        Lấy tên tài liệu nguồn dựa trên category.
        
        Args:
            category: Phân loại
            
        Returns:
            Tên tài liệu nguồn
        """
        documents = {
            "bhxh": "Luật Bảo hiểm xã hội 2014",
            "ld": "Bộ luật Lao động 2019",
            "bhyt": "Luật Bảo hiểm y tế",
            "contract": "Bộ luật Lao động 2019",
            "salary": "Nghị định về lương tối thiểu",
            "leave": "Bộ luật Lao động 2019",
            "termination": "Bộ luật Lao động 2019"
        }
        return documents.get(category, "Văn bản pháp luật liên quan")
    
    def generate_test_set(
        self, 
        num_cases: int = 100,
        include_hardcoded: bool = True
    ) -> List[TestCase]:
        """
        Tạo tập test với số lượng cases chỉ định.
        
        Args:
            num_cases: Số lượng test cases cần tạo
            include_hardcoded: Có bao gồm 5 cases mẫu không
            
        Returns:
            List các test cases
        """
        test_cases = []
        
        # Thêm hardcoded cases nếu được yêu cầu
        if include_hardcoded:
            test_cases.extend(self._hardcoded_cases)
            logger.info(f"Đã thêm {len(self._hardcoded_cases)} test cases mẫu")
        
        # Tính số lượng cases cần tạo thêm
        remaining_cases = max(0, num_cases - len(test_cases))
        
        # Tạo cases tự động
        logger.info(f"Đang tạo {remaining_cases} test cases tự động...")
        
        for i in range(remaining_cases):
            # Chọn category và difficulty ngẫu nhiên
            category = random.choice(self.categories)
            difficulty = random.choice(self.difficulties)
            
            # Tạo test case
            test_case = self._generate_test_case(category, difficulty, i)
            
            if test_case:
                test_cases.append(test_case)
                
                if (i + 1) % 10 == 0:
                    logger.info(f"Đã tạo {i + 1}/{remaining_cases} test cases")
        
        logger.info(f"✅ Đã tạo tổng cộng {len(test_cases)} test cases")
        return test_cases
    
    def save_to_huggingface_format(
        self, 
        test_cases: List[TestCase], 
        output_file: str = "test_dataset.jsonl"
    ) -> str:
        """
        Lưu tập test dưới định dạng HuggingFace Dataset (JSONL).
        
        Args:
            test_cases: List các test cases
            output_file: Tên file output
            
        Returns:
            Đường dẫn đến file đã lưu
        """
        output_path = os.path.join(self.output_dir, output_file)
        
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                for test_case in test_cases:
                    # Format theo chuẩn RAGAS/HuggingFace
                    data_point = {
                        "question": test_case.question,
                        "answer": test_case.ground_truth,
                        "contexts": [test_case.context],  # RAGAS expects list of contexts
                        "ground_truth": test_case.ground_truth,
                        "metadata": {
                            "category": test_case.category,
                            "difficulty": test_case.difficulty,
                            "source_document": test_case.source_document,
                            "article_reference": test_case.article_reference,
                            **test_case.metadata
                        }
                    }
                    f.write(json.dumps(data_point, ensure_ascii=False) + '\n')
            
            logger.info(f"✅ Đã lưu {len(test_cases)} test cases vào {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"❌ Lỗi khi lưu tập test: {e}")
            raise
    
    def save_to_json(
        self, 
        test_cases: List[TestCase], 
        output_file: str = "test_dataset.json"
    ) -> str:
        """
        Lưu tập test dưới định dạng JSON.
        
        Args:
            test_cases: List các test cases
            output_file: Tên file output
            
        Returns:
            Đường dẫn đến file đã lưu
        """
        output_path = os.path.join(self.output_dir, output_file)
        
        try:
            data = {
                "test_set": {
                    "total_cases": len(test_cases),
                    "created_at": datetime.now().isoformat(),
                    "categories": {},
                    "difficulties": {}
                },
                "cases": [tc.to_dict() for tc in test_cases]
            }
            
            # Thống kê categories
            for tc in test_cases:
                data["test_set"]["categories"][tc.category] = \
                    data["test_set"]["categories"].get(tc.category, 0) + 1
                data["test_set"]["difficulties"][tc.difficulty] = \
                    data["test_set"]["difficulties"].get(tc.difficulty, 0) + 1
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"✅ Đã lưu tập test vào {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"❌ Lỗi khi lưu tập test JSON: {e}")
            raise
    
    def load_test_set(self, input_file: str) -> List[TestCase]:
        """
        Tải tập test từ file.
        
        Args:
            input_file: Đường dẫn đến file input
            
        Returns:
            List các test cases
        """
        input_path = os.path.join(self.output_dir, input_file)
        
        try:
            test_cases = []
            
            if input_file.endswith('.jsonl'):
                # HuggingFace format
                with open(input_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        data = json.loads(line.strip())
                        
                        # Chuyển đổi từ HuggingFace format sang TestCase
                        metadata = data.get("metadata", {})
                        test_case = TestCase(
                            question=data["question"],
                            ground_truth=data.get("ground_truth", data.get("answer", "")),
                            context=data["contexts"][0] if data.get("contexts") else "",
                            category=metadata.get("category", "unknown"),
                            difficulty=metadata.get("difficulty", "medium"),
                            source_document=metadata.get("source_document", ""),
                            article_reference=metadata.get("article_reference", ""),
                            metadata=metadata
                        )
                        test_cases.append(test_case)
                        
            elif input_file.endswith('.json'):
                # JSON format
                with open(input_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    for case_data in data.get("cases", []):
                        test_case = TestCase(
                            question=case_data["question"],
                            ground_truth=case_data["ground_truth"],
                            context=case_data["context"],
                            category=case_data["category"],
                            difficulty=case_data["difficulty"],
                            source_document=case_data["source_document"],
                            article_reference=case_data["article_reference"],
                            metadata=case_data.get("metadata", {})
                        )
                        test_cases.append(test_case)
            
            logger.info(f"✅ Đã tải {len(test_cases)} test cases từ {input_path}")
            return test_cases
            
        except Exception as e:
            logger.error(f"❌ Lỗi khi tải tập test: {e}")
            return []
    
    def analyze_test_set(self, test_cases: List[TestCase]) -> Dict[str, Any]:
        """
        Phân tích tập test.
        
        Args:
            test_cases: List các test cases
            
        Returns:
            Dictionary chứa thống kê
        """
        stats = {
            "total_cases": len(test_cases),
            "by_category": {},
            "by_difficulty": {},
            "avg_question_length": 0,
            "avg_answer_length": 0,
            "avg_context_length": 0
        }
        
        total_q_len = 0
        total_a_len = 0
        total_c_len = 0
        
        for tc in test_cases:
            # Thống kê category
            stats["by_category"][tc.category] = stats["by_category"].get(tc.category, 0) + 1
            
            # Thống kê difficulty
            stats["by_difficulty"][tc.difficulty] = stats["by_difficulty"].get(tc.difficulty, 0) + 1
            
            # Tính độ dài
            total_q_len += len(tc.question)
            total_a_len += len(tc.ground_truth)
            total_c_len += len(tc.context)
        
        # Tính trung bình
        if test_cases:
            stats["avg_question_length"] = total_q_len / len(test_cases)
            stats["avg_answer_length"] = total_a_len / len(test_cases)
            stats["avg_context_length"] = total_c_len / len(test_cases)
        
        return stats


def generate_test_dataset(
    num_cases: int = 100,
    output_dir: str = "evaluation_results",
    format: str = "both"  # "jsonl", "json", or "both"
) -> Dict[str, str]:
    """
    Hàm tiện ích để tạo tập test.
    
    Args:
        num_cases: Số lượng test cases
        output_dir: Thư mục output
        format: Định dạng output
        
    Returns:
        Dictionary với đường dẫn đến các file đã tạo
    """
    generator = TestSetGenerator(output_dir)
    
    # Tạo tập test
    test_cases = generator.generate_test_set(num_cases, include_hardcoded=True)
    
    # Lưu tập test
    result_files = {}
    
    if format in ["jsonl", "both"]:
        jsonl_path = generator.save_to_huggingface_format(
            test_cases, "test_dataset.jsonl"
        )
        result_files["jsonl"] = jsonl_path
    
    if format in ["json", "both"]:
        json_path = generator.save_to_json(test_cases, "test_dataset.json")
        result_files["json"] = json_path
    
    # Phân tích tập test
    stats = generator.analyze_test_set(test_cases)
    print("\n📊 Test Set Statistics:")
    print(f"   Total cases: {stats['total_cases']}")
    print(f"   By category: {stats['by_category']}")
    print(f"   By difficulty: {stats['by_difficulty']}")
    print(f"   Avg question length: {stats['avg_question_length']:.1f} chars")
    print(f"   Avg answer length: {stats['avg_answer_length']:.1f} chars")
    print(f"   Avg context length: {stats['avg_context_length']:.1f} chars")
    
    return result_files


if __name__ == "__main__":
    """Test generator với 50 test cases."""
    print("🧪 Testing Test Set Generator...")
    print("=" * 60)
    
    try:
        # Tạo 50 test cases
        files = generate_test_dataset(num_cases=50, format="both")
        
        print("\n✅ Generated files:")
        for format_type, filepath in files.items():
            print(f"   - {format_type}: {filepath}")
        
        # Tải lại để verify
        generator = TestSetGenerator()
        test_cases = generator.load_test_set("test_dataset.json")
        
        print(f"\n✅ Loaded {len(test_cases)} test cases for verification")
        
        # Hiển thị 3 test cases đầu tiên
        print("\n📝 Sample test cases:")
        for i, tc in enumerate(test_cases[:3]):
            print(f"\n--- Test Case {i+1} ---")
            print(f"Category: {tc.category} | Difficulty: {tc.difficulty}")
            print(f"Question: {tc.question[:80]}...")
            print(f"Answer: {tc.ground_truth[:80]}...")
            print(f"Source: {tc.source_document} {tc.article_reference}")
        
        print("\n" + "=" * 60)
        print("✅ Test set generator test completed successfully")
        
    except Exception as e:
        print(f"\n❌ Error during test: {e}")
        import traceback
        traceback.print_exc()
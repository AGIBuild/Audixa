---
name: /review-design
id: review-design
category: Review
description: 审查系统架构与技术方案的致命风险（否决导向）
---

Apply the `review-design` skill.

**Input**: The argument after `/review-design` is the design/architecture plan to review. If no input is provided, ask the user to paste the plan or attach the relevant documents.

**Rules**
- Do NOT write code.
- Do NOT provide improvements or alternatives.
- Only list fatal issues with evidence/reasoning and a veto rationale.
- If key information is missing, conclude "无法评审" and list missing items as fatal.

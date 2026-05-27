# Customer Analytics & CLV Predictions Repository

This directory contains a standalone python pipeline designed to read historical customer transaction data, perform RFM (Recency, Frequency, Monetary) segmentation, and calculate multi-horizon predictive Customer Lifetime Value (CLV) forecast curves.

---

## Technical Stack & Packages
- **Python**: 3.8+
- **Pandas**: Data ingestion and matrix calculation
- **Numpy**: Probabilistic mathematical calculations
- **Matplotlib**: Report generation and visual rendering
- **Lifetimes / Scikit-Learn** (Optional but supported)

---

## Repository Structure
```bash
├── README.md                  # Comprehensive operational guide
├── requirements.txt           # Python environment packages list
├── generate_data.py           # Synthesis scripting utility
├── clv_analytics_model.py     # Core analytics, RFM and CLV mathematical scoring pipeline
```

---

## Fast Start Instructions

### 1. Set Up Environment
Create and activate an isolated python environment (recommended):
```bash
# Create local virtual setup
python -m venv venv

# Activate on Linux/macOS
source venv/bin/activate

# Activate on Windows
venv\Scripts\activate
```

### 2. Install Required Packages
```bash
pip install -r requirements.txt
```

### 3. Generate Simulated Database
Create a mock CSV database containing historical transaction series:
```bash
python generate_data.py transactions.csv
```
This generates `transactions.csv` detailing timestamps, transactional identifiers, customer keys, and values.

### 4. Execute Prediction Models & Diagnostics
Compute segments, decay factors, and predict survival patterns:
```bash
python clv_analytics_model.py transactions.csv
```

---

## Output Metrics & Artifacts
The training script will output diagnostics summaries straight to the term window and persist:
1. `output/customer_clv_predictions.csv`: Rich table containing customized `customer_id` rows with their historical totals, computed segment labels, churn probabilities, and multi-year discounted future economic forecasts (`clv_pred_1y`, `clv_pred_3y`, `clv_pred_5y`).
2. `output/segments_distribution.png`: Graphic distribution detailing segment counts.

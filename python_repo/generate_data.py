# -*- coding: utf-8 -*-
"""
Transactions Generator Utility
Author: Analytics & ML Team
Description:
    Generates realistic, sequential transaction history containing timestamps, 
    amounts, and customer IDs with diverse customer behavior models (archetypes).
"""

import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def create_ecommerce_transactions(filepath='transactions.csv', n_customers=1000, n_transactions=15000):
    """
    Simulates transactional logs for a modern business.
    Each customer belongs to a behavioral segment affecting purchase cadence,
    churn likelihood, and basket sizes.
    """
    print(f"[*] Starting e-commerce transaction simulation...")
    print(f"[*] Generating {n_transactions} logs across {n_customers} profiles...")
    np.random.seed(84)
    
    customer_ids = [f"CUST-{2000 + i:04d}" for i in range(n_customers)]
    
    # Archetype assignments
    # 1. VIP (small group, high spend, frequent)
    # 2. Frequent flyers (moderate spend, consistent frequency)
    # 3. Bargain Hunters (only buy during promos or seasonally)
    # 4. Inactive / One-time (single high-churn group)
    archetypes = ['VIP', 'Frequent', 'Bargain', 'OneTime']
    customer_archetypes = np.random.choice(
        archetypes, 
        size=n_customers, 
        p=[0.08, 0.37, 0.35, 0.20]
    )
    
    # Parameters definitions
    avg_basket_values = {'VIP': 185.0, 'Frequent': 65.0, 'Bargain': 42.0, 'OneTime': 35.0}
    purchase_rates = {'VIP': 0.12, 'Frequent': 0.05, 'Bargain': 0.015, 'OneTime': 0.002}
    
    # Timeline definition
    end_date = datetime(2026, 5, 27)
    start_date = end_date - timedelta(days=365) # 1 Year history
    
    transactions = []
    
    for c_id, arch in zip(customer_ids, customer_archetypes):
        # Register date for customer
        joined_days_ago = np.random.randint(15, 360)
        register_date = end_date - timedelta(days=joined_days_ago)
        
        # Initial activation transaction
        first_basket = np.random.exponential(avg_basket_values[arch]) + 10.0
        transactions.append({
            'transaction_id': f"TXN-{100000 + len(transactions)}",
            'customer_id': c_id,
            'timestamp': register_date.strftime('%Y-%m-%d %H:%M:%S'),
            'amount': round(first_basket, 2),
            'category': np.random.choice(['Electronics', 'Apparel', 'Home', 'Groceries'], p=[0.2, 0.4, 0.1, 0.3])
        })
        
        # Subsequent repurchases
        if arch == 'OneTime':
            continue # One-time shoppers do not repurchase
            
        rate = purchase_rates[arch]
        current_time = register_date + timedelta(days=np.random.randint(2, 20))
        
        while current_time <= end_date:
            # Propensity to buy
            if np.random.rand() < rate:
                basket_val = np.random.exponential(avg_basket_values[arch] * 0.95) + 5.0
                transactions.append({
                    'transaction_id': f"TXN-{100000 + len(transactions)}",
                    'customer_id': c_id,
                    'timestamp': current_time.strftime('%Y-%m-%d %H:%M:%S'),
                    'amount': round(basket_val, 2),
                    'category': np.random.choice(['Electronics', 'Apparel', 'Home', 'Groceries'], p=[0.2, 0.4, 0.1, 0.3])
                })
                # Add lag after buying
                current_time += timedelta(days=np.random.randint(4, 25))
            else:
                current_time += timedelta(days=1)
                
    df = pd.DataFrame(transactions)
    # Sort chronologically
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values('timestamp').reset_index(drop=True)
    
    # Save CSV
    df.to_csv(filepath, index=False)
    print(f"[✓] Transaction data successfully emitted to '{filepath}'")
    print(f"[✓] Total transactions generated: {len(df)}")
    print(f"[✓] Average ticket size: ${df['amount'].mean():.2f}")
    
if __name__ == "__main__":
    filepath = sys.argv[1] if len(sys.argv) > 1 else 'transactions.csv'
    create_ecommerce_transactions(filepath)

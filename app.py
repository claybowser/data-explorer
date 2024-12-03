import matplotlib
matplotlib.use('Agg')  # Set the backend before importing pyplot

from flask import Flask, render_template, request, jsonify
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64

# Initialize Flask app
app = Flask(__name__)

# Store uploaded datasets
datasets = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    try:
        df = pd.read_csv(file)
        datasets['current'] = df
        columns = df.columns.tolist()
        summary = df.describe().to_dict()
        
        return jsonify({
            'message': 'File uploaded successfully',
            'columns': columns,
            'summary': summary
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/generate_plot', methods=['POST'])
def generate_plot():
    data = request.json
    plot_type = data.get('plot_type')
    x_column = data.get('x_column')
    y_column = data.get('y_column')
    
    if 'current' not in datasets:
        return jsonify({'error': 'No dataset uploaded'}), 400
    
    df = datasets['current']
    
    try:
        plt.figure(figsize=(10, 6))
        
        try:
            if plot_type == 'scatter':
                if not y_column:
                    return jsonify({'error': 'Y-axis column required for scatter plot'}), 400
                plt.scatter(df[x_column], df[y_column])
                plt.xlabel(x_column)
                plt.ylabel(y_column)
                plt.title(f'Scatter Plot: {x_column} vs {y_column}')
                
            elif plot_type == 'bar':
                counts = df[x_column].value_counts()
                counts.plot(kind='bar')
                plt.xlabel(x_column)
                plt.ylabel('Count')
                plt.title(f'Bar Chart: {x_column} Distribution')
                plt.xticks(rotation=45)
                
            elif plot_type == 'heatmap':
                numeric_df = df.select_dtypes(include=['float64', 'int64'])
                correlation = numeric_df.corr()
                sns.heatmap(correlation, annot=True, cmap='coolwarm', center=0)
                plt.title('Correlation Heatmap')
            
            buffer = io.BytesIO()
            plt.tight_layout()
            plt.savefig(buffer, format='png', dpi=300)
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            return jsonify({'image': image_base64})
            
        finally:
            # Clean up resources
            plt.close('all')
            buffer.close()
            
    except Exception as e:
        plt.close('all')  # Ensure plots are closed even if there's an error
        return jsonify({'error': str(e)}), 400

@app.route('/get_summary', methods=['GET'])
def get_summary():
    if 'current' not in datasets:
        return jsonify({'error': 'No dataset uploaded'}), 400
    
    try:
        df = datasets['current']
        summary = {
            'shape': df.shape,
            'columns': df.columns.tolist(),
            'missing_values': df.isnull().sum().to_dict(),
            'datatypes': df.dtypes.astype(str).to_dict(),
            'numeric_summary': df.describe().to_dict()
        }
        
        return jsonify(summary)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/get_css')
def get_css():
    with open('static/css/style.css', 'r') as f:
        css = f.read()
    return jsonify({'css': css})

if __name__ == '__main__':
    app.run(debug=True) 
import unittest
import json
import os
from app import app, datasets  # Import datasets dictionary
import pandas as pd
import base64

class TestDataExplorer(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        # Path to test data
        self.test_data_path = os.path.join(
            os.path.dirname(__file__), 
            'test_data', 
            'sample.csv'
        )
        # Clear any existing data
        datasets.clear()

    def tearDown(self):
        # Clean up after each test
        datasets.clear()

    def test_home_page(self):
        """Test if home page loads correctly"""
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Data Explorer', response.data)

    def test_upload_file(self):
        """Test file upload functionality"""
        with open(self.test_data_path, 'rb') as file:
            response = self.app.post(
                '/upload',
                data={'file': (file, 'sample.csv')}
            )
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertIn('columns', data)
            self.assertIn('summary', data)
            self.assertEqual(len(data['columns']), 4)  # Check number of columns

    def test_upload_no_file(self):
        """Test upload endpoint with no file"""
        response = self.app.post('/upload')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)

    def test_generate_plot(self):
        """Test plot generation"""
        # First upload a file
        with open(self.test_data_path, 'rb') as file:
            self.app.post('/upload', data={'file': (file, 'sample.csv')})

        # Test different plot types
        plot_types = ['scatter', 'bar', 'heatmap']
        for plot_type in plot_types:
            data = {
                'plot_type': plot_type,
                'x_column': 'age',
                'y_column': 'salary' if plot_type == 'scatter' else None
            }
            response = self.app.post(
                '/generate_plot',
                json=data,
                content_type='application/json'
            )
            self.assertEqual(response.status_code, 200)
            response_data = json.loads(response.data)
            self.assertIn('image', response_data)
            # Verify the response contains a valid base64 image
            try:
                base64.b64decode(response_data['image'])
            except Exception:
                self.fail(f"Invalid base64 image for plot type: {plot_type}")

    def test_get_summary(self):
        """Test summary statistics generation"""
        # First upload a file
        with open(self.test_data_path, 'rb') as file:
            self.app.post('/upload', data={'file': (file, 'sample.csv')})

        response = self.app.get('/get_summary')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Check if all expected keys are present
        expected_keys = ['shape', 'columns', 'missing_values', 
                        'datatypes', 'numeric_summary']
        for key in expected_keys:
            self.assertIn(key, data)
        
        # Verify the shape of the dataset
        self.assertEqual(data['shape'], [4, 4])

    def test_get_summary_no_data(self):
        """Test summary endpoint with no data uploaded"""
        response = self.app.get('/get_summary')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)

    def test_get_css(self):
        """Test CSS endpoint"""
        response = self.app.get('/get_css')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('css', data)
        self.assertIsInstance(data['css'], str)

if __name__ == '__main__':
    unittest.main() 
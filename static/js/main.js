function uploadFile() {
    const fileInput = document.getElementById('fileUpload');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file first');
        return;
    }

    // Show loading indicator
    const uploadButton = document.querySelector('.upload-section button');
    uploadButton.textContent = 'Uploading...';
    uploadButton.disabled = true;

    const formData = new FormData();
    formData.append('file', file);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        
        // Populate column selectors
        const xColumn = document.getElementById('xColumn');
        const yColumn = document.getElementById('yColumn');
        
        xColumn.innerHTML = '';
        yColumn.innerHTML = '';
        
        data.columns.forEach(column => {
            xColumn.add(new Option(column, column));
            yColumn.add(new Option(column, column));
        });
        
        // Show success message
        alert('File uploaded successfully!');
        
        // Enable visualization section - use new class
        document.querySelector('.visualization-section').classList.remove('section-hidden');
        document.querySelector('.summary-section').classList.remove('section-hidden');
    })
    .catch(error => {
        alert('Error uploading file: ' + error);
    })
    .finally(() => {
        // Reset upload button
        uploadButton.textContent = 'Upload';
        uploadButton.disabled = false;
    });
}

function updateColumnSelectors() {
    const plotType = document.getElementById('plotType').value;
    const yColumnSelect = document.getElementById('yColumn');
    const columnSelectorsDiv = document.getElementById('columnSelectors');
    const xColumnLabel = document.getElementById('xColumnLabel');
    const plotDescription = document.getElementById('plotDescription');
    
    // Update plot description
    const descriptions = {
        'scatter': `
            <p><strong>Scatter Plot:</strong></p>
            <p>• Shows relationships between two variables</p>
            <p>• Requires both X and Y axis selections</p>
            <p>• Example: Plot Age vs Fare to see if there's a relationship between passenger age and ticket price</p>
        `,
        'bar': `
            <p><strong>Bar Chart:</strong></p>
            <p>• Shows distribution or counts of a single variable</p>
            <p>• Requires only one column selection</p>
            <p>• Example: Show number of passengers in each class</p>
        `,
        'heatmap': `
            <p><strong>Correlation Heatmap:</strong></p>
            <p>• Shows correlations between all numerical variables</p>
            <p>• No column selection needed</p>
            <p>• Automatically analyzes relationships between all numeric columns</p>
        `
    };
    
    plotDescription.innerHTML = descriptions[plotType];
    
    // Update column selectors visibility
    if (plotType === 'bar') {
        // Bar charts only need one column
        yColumnSelect.style.display = 'none';
        xColumnLabel.textContent = 'Select Column:';
        columnSelectorsDiv.style.display = 'block';
    } else if (plotType === 'heatmap') {
        // Heatmap doesn't need column selection
        columnSelectorsDiv.style.display = 'none';
    } else {
        // Scatter plot needs both columns
        columnSelectorsDiv.style.display = 'block';
        yColumnSelect.style.display = 'inline-block';
        xColumnLabel.textContent = 'X-Axis:';
    }
}

function generatePlot() {
    const plotType = document.getElementById('plotType').value;
    const xColumn = document.getElementById('xColumn').value;
    const yColumn = plotType === 'scatter' ? document.getElementById('yColumn').value : null;

    fetch('/generate_plot', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            plot_type: plotType,
            x_column: xColumn,
            y_column: yColumn
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        
        const plotImage = document.getElementById('plotImage');
        plotImage.src = 'data:image/png;base64,' + data.image;
    })
    .catch(error => {
        alert('Error generating plot: ' + error);
    });
}

function getSummary() {
    fetch('/get_summary')
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        
        const summaryOutput = document.getElementById('summaryOutput');
        
        // Create formatted HTML
        let html = `
            <div class="summary-container">
                <div class="summary-section">
                    <h3>Dataset Overview</h3>
                    <p>Number of Rows: ${data.shape[0]}</p>
                    <p>Number of Columns: ${data.shape[1]}</p>
                </div>

                <div class="summary-section">
                    <h3>Columns and Data Types</h3>
                    <table class="summary-table">
                        <tr>
                            <th>Column</th>
                            <th>Type</th>
                            <th>Missing Values</th>
                        </tr>
                        ${data.columns.map(col => `
                            <tr>
                                <td>${col}</td>
                                <td>${data.datatypes[col]}</td>
                                <td>${data.missing_values[col]}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>

                <div class="summary-section">
                    <h3>Numerical Columns Statistics</h3>
                    ${Object.entries(data.numeric_summary).map(([col, stats]) => `
                        <div class="numeric-stats">
                            <h4>${col}</h4>
                            <table class="summary-table">
                                <tr>
                                    <td>Count</td>
                                    <td>${stats.count.toFixed(0)}</td>
                                </tr>
                                <tr>
                                    <td>Mean</td>
                                    <td>${stats.mean.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Std Dev</td>
                                    <td>${stats.std.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Min</td>
                                    <td>${stats.min.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>25%</td>
                                    <td>${stats['25%'].toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>50% (Median)</td>
                                    <td>${stats['50%'].toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>75%</td>
                                    <td>${stats['75%'].toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Max</td>
                                    <td>${stats.max.toFixed(2)}</td>
                                </tr>
                            </table>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        summaryOutput.innerHTML = html;
    })
    .catch(error => {
        alert('Error getting summary: ' + error);
    });
}

function generateReport() {
    // First get the CSS
    fetch('/get_css')
        .then(response => response.json())
        .then(data => {
            const currentState = {
                plotImage: document.getElementById('plotImage').src,
                summaryContent: document.getElementById('summaryOutput').innerHTML,
                plotType: document.getElementById('plotType').value,
                plotDescription: document.getElementById('plotDescription').innerHTML
            };

            // Create the report HTML with the actual CSS content
            const reportHTML = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Data Analysis Report</title>
                    <style>
                        ${data.css}
                        /* Additional report-specific styles */
                        body {
                            padding: 20px;
                            font-family: Arial, sans-serif;
                        }
                        .report-header {
                            text-align: center;
                            margin-bottom: 30px;
                            padding-bottom: 20px;
                            border-bottom: 2px solid #4CAF50;
                        }
                        .timestamp {
                            color: #666;
                            font-size: 0.9em;
                        }
                        .report-section {
                            margin-bottom: 40px;
                        }
                        @media print {
                            .report-section {
                                page-break-inside: avoid;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="report-header">
                        <h1>Data Analysis Report</h1>
                        <p class="timestamp">Generated on: ${new Date().toLocaleString()}</p>
                    </div>

                    <div class="report-section">
                        <h2>Visualization</h2>
                        <h3>${currentState.plotType} Analysis</h3>
                        ${currentState.plotDescription}
                        <div class="plot-container">
                            <img src="${currentState.plotImage}" alt="Data Visualization" style="max-width: 100%; height: auto;">
                        </div>
                    </div>

                    <div class="report-section">
                        <h2>Data Summary</h2>
                        ${currentState.summaryContent}
                    </div>
                </body>
                </html>
            `;

            // Create a blob and download the file
            const blob = new Blob([reportHTML], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'data-analysis-report.html';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        })
        .catch(error => {
            alert('Error generating report: ' + error);
        });
}

// Call updateColumnSelectors initially to set the default description
document.addEventListener('DOMContentLoaded', function() {
    updateColumnSelectors();
}); 
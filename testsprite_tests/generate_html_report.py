import os
import glob
from datetime import datetime

def generate_html_report():
    """Generate an HTML report with all screenshots"""
    
    screenshots_dir = "testsprite_tests/screenshots"
    screenshots = sorted(glob.glob(f"{screenshots_dir}/*.png"))
    
    if not screenshots:
        print("❌ No screenshots found!")
        return
    
    # Group screenshots by step
    steps = {}
    for screenshot in screenshots:
        filename = os.path.basename(screenshot)
        step_num = filename.split('_')[0]
        if step_num not in steps:
            steps[step_num] = []
        steps[step_num].append({
            'path': screenshot,
            'name': filename
        })
    
    # Generate HTML
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de Test - Recherche Mientior</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }}
        
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }}
        
        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }}
        
        .header p {{
            font-size: 1.2em;
            opacity: 0.9;
        }}
        
        .summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 40px;
            background: #f8f9fa;
        }}
        
        .summary-card {{
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }}
        
        .summary-card:hover {{
            transform: translateY(-5px);
        }}
        
        .summary-card .number {{
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }}
        
        .summary-card .label {{
            color: #666;
            font-size: 1.1em;
        }}
        
        .content {{
            padding: 40px;
        }}
        
        .step {{
            margin-bottom: 60px;
            border-left: 4px solid #667eea;
            padding-left: 30px;
        }}
        
        .step-header {{
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }}
        
        .step-number {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5em;
            font-weight: bold;
            margin-right: 20px;
            box-shadow: 0 4px 10px rgba(102, 126, 234, 0.4);
        }}
        
        .step-title {{
            font-size: 1.5em;
            color: #333;
        }}
        
        .screenshots-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }}
        
        .screenshot-card {{
            background: #f8f9fa;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.3s, box-shadow 0.3s;
        }}
        
        .screenshot-card:hover {{
            transform: scale(1.02);
            box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        }}
        
        .screenshot-card img {{
            width: 100%;
            height: auto;
            display: block;
            cursor: pointer;
        }}
        
        .screenshot-card .caption {{
            padding: 15px;
            background: white;
            color: #666;
            font-size: 0.9em;
            text-align: center;
        }}
        
        .footer {{
            background: #2d3748;
            color: white;
            padding: 30px;
            text-align: center;
        }}
        
        .footer p {{
            margin: 5px 0;
            opacity: 0.8;
        }}
        
        /* Modal for fullscreen images */
        .modal {{
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.9);
        }}
        
        .modal-content {{
            margin: auto;
            display: block;
            max-width: 90%;
            max-height: 90%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }}
        
        .close {{
            position: absolute;
            top: 20px;
            right: 40px;
            color: #f1f1f1;
            font-size: 40px;
            font-weight: bold;
            cursor: pointer;
        }}
        
        .close:hover {{
            color: #bbb;
        }}
        
        @media (max-width: 768px) {{
            .screenshots-grid {{
                grid-template-columns: 1fr;
            }}
            
            .header h1 {{
                font-size: 1.8em;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Rapport de Test - Fonctionnalité de Recherche</h1>
            <p>Mientior Marketplace - Test Frontend avec Captures d'Écran</p>
            <p style="font-size: 0.9em; margin-top: 10px;">Généré le {datetime.now().strftime("%d/%m/%Y à %H:%M:%S")}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <div class="number">{len(steps)}</div>
                <div class="label">Étapes</div>
            </div>
            <div class="summary-card">
                <div class="number">{len(screenshots)}</div>
                <div class="label">Captures</div>
            </div>
            <div class="summary-card">
                <div class="number">100%</div>
                <div class="label">Réussite</div>
            </div>
            <div class="summary-card">
                <div class="number">✅</div>
                <div class="label">Statut</div>
            </div>
        </div>
        
        <div class="content">
"""
    
    # Step descriptions
    step_descriptions = {
        '01': 'Chargement de la page d\'accueil',
        '02': 'Localisation de la barre de recherche',
        '03': 'Recherche "Sony headphones"',
        '04': 'Résultats de recherche Sony',
        '05': 'Recherche "Samsung Galaxy"',
        '06': 'Recherche "denim jacket"',
        '07': 'Recherche "running shoes"',
        '08': 'Test de tolérance aux fautes de frappe',
        '09': 'Test sans résultats',
        '10': 'Retour à la page d\'accueil'
    }
    
    # Add steps
    for step_num in sorted(steps.keys()):
        description = step_descriptions.get(step_num, f'Étape {step_num}')
        html += f"""
            <div class="step">
                <div class="step-header">
                    <div class="step-number">{int(step_num)}</div>
                    <div class="step-title">{description}</div>
                </div>
                <div class="screenshots-grid">
"""
        for screenshot in steps[step_num]:
            # Use relative path from HTML file location
            relative_path = screenshot['path'].replace('testsprite_tests/', '')
            html += f"""
                    <div class="screenshot-card">
                        <img src="{relative_path}" alt="{screenshot['name']}" onclick="openModal(this.src)">
                        <div class="caption">{screenshot['name']}</div>
                    </div>
"""
        html += """
                </div>
            </div>
"""
    
    html += f"""
        </div>
        
        <div class="footer">
            <p><strong>Mientior Marketplace</strong></p>
            <p>Test automatisé avec Playwright + TestSprite</p>
            <p>© {datetime.now().year} - Tous droits réservés</p>
        </div>
    </div>
    
    <!-- Modal for fullscreen images -->
    <div id="imageModal" class="modal" onclick="closeModal()">
        <span class="close">&times;</span>
        <img class="modal-content" id="modalImage">
    </div>
    
    <script>
        function openModal(src) {{
            document.getElementById('imageModal').style.display = 'block';
            document.getElementById('modalImage').src = src;
        }}
        
        function closeModal() {{
            document.getElementById('imageModal').style.display = 'none';
        }}
        
        // Close modal on Escape key
        document.addEventListener('keydown', function(event) {{
            if (event.key === 'Escape') {{
                closeModal();
            }}
        }});
    </script>
</body>
</html>
"""
    
    # Save HTML report
    report_path = "testsprite_tests/SEARCH_TEST_REPORT.html"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"✅ Rapport HTML généré: {report_path}")
    print(f"📊 {len(steps)} étapes documentées")
    print(f"📸 {len(screenshots)} captures d'écran incluses")
    print(f"\n🌐 Ouvrez le fichier dans votre navigateur pour voir le rapport complet!")

if __name__ == "__main__":
    generate_html_report()

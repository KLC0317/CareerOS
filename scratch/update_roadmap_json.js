const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'roadmap.json');

try {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  data.app_metadata.ui_setup = {
    theme: "dark_mode_glassmorphism",
    node_styling: {
      border_radius: "lg",
      default_bg_color: "#1E293B",
      highlight_bg_color: "#3B82F6",
      text_color: "#F8FAFC"
    },
    edge_styling: {
      type: "smoothstep",
      stroke_color: "#64748B",
      animated: true
    }
  };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Successfully updated public/roadmap.json with ui_setup metadata.');
} catch (err) {
  console.error('Error updating roadmap.json:', err);
}

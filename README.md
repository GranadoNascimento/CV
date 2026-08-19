# 🗺️ 3D Interactive Career Portfolio
### Interactive Career Showcase | Adailton Granado

This project is a high-fidelity 3D interactive application built with the **ArcGIS Maps SDK for JavaScript**. It serves as an interactive curriculum vitae, visualizing a career in RPA & AI Development spanning Brazil and Spain.

## 🌐 Live Demo
Experience the interactive globe here:  
👉 **[https://granadonascimento.github.io/CV/](https://granadonascimento.github.io/CV/)**

---

## 🚀 Key Technical Features

### 1. Dynamic 3D Navigation
* **Automated Career Tour:** An optimized "instant-start" navigation system that flies the camera through professional milestones with specific tilt and heading adjustments.
* **Responsive Camera Offsets:** Advanced logic that adjusts the focal point based on the device (Mobile vs. Desktop) to ensure visibility above UI overlays.

### 2. Advanced Data Filtering
* **Bi-directional Sync:** Filtering by Country or Career Level updates both the sidebar list and the map features simultaneously.
* **SQL-based Expressions:** Utilizes `definitionExpression` to physically filter GeoJSON features on the client-side, ensuring a clean and focused map view.

### 3. Professional UX/UI
* **Mobile-First Approach:** A custom "Bottom Sheet" layout for mobile devices with a toggleable (**Minimize/Maximize**) sidebar.
* **Custom Theming:** Dark-mode interface with customized ArcGIS widgets including **Daylight**, **Basemap Gallery**, and **Measurement Tools**.

---

## 🛠️ Technology Stack
* **Engine:** [ArcGIS Maps SDK for JavaScript v4.29](https://developers.arcgis.com/javascript/latest/)
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Data:** Standalone GeoJSON dataset for decoupled data management.
* **Deployment:** GitHub Pages.

---

## 📂 Project Structure
```text
adailton-granado-cv/
├─ index.html           # Main entry point and UI structure
├─ css/
│  └─ style.css         # Custom responsive styles and ArcGIS overrides
├─ js/
│  └─ main.js           # Application logic and tour functions
├─ data/
│  └─ career.geojson    # Decoupled spatial dataset
├─ assets/
│  ├─ Picture1.jpeg     # Profile photography
│  └─ Adailton_Granado_CV.pdf  # Downloadable professional resume
└─ README.md            # Project documentation

FEATURE_BRIEF_ASSESSMENT_FORMS.md

# Arboracle Master Form Specifications & Development Blueprint
## A Definitive Guide for Professional-Grade Tree Data Collection

**Document Version:** 3.0
**Date:** [07-27-2025]

### I. Preface: Our Guiding Principles & Core Vision

**To the Arboracle AI Agent Team:** This document is the **single source of truth** for all data collection forms within the Arboracle platform. It synthesizes insights from professional-grade field tools (Fulcrum) and our specific development vision. Our mission is to build a system that is both intuitively simple for enthusiasts and deeply powerful for arboricultural professionals.

**All development must adhere to these principles:**

1.  **Store Data Systematically, Display Flexibly:** All core data (measurements, coordinates) will be stored in a single, standard format in the database (Metric units: cm, m; WGS84 coordinates). The application's front end is responsible for converting and displaying this data in the user's preferred format (Metric or Imperial), as set in their profile. This prevents data corruption and simplifies calculations.
2.  **Prioritize Structured Data with Notes:** We will use structured inputs (checklists, dropdowns, toggles) as the primary data capture method. Free-text fields are reserved for narrative summaries and **optional, specific notes tied directly to a checked item.** This is the key to data consistency, entry speed, and powerful AI analysis.
3.  **Architect for the AI-First Future:** Every form field and data model must be built with a future voice-first, agent-driven system in mind. This means creating clean, stateless APIs for granular data updates and designing data structures that can be easily manipulated by natural language processing.

---

### II. Core Database Schema

**Objective:** To establish a clear and scalable database schema that supports all current and future features. This structure supports both the individual tree enthusiast and commercial project management.

*   **`Projects` Table:** For organizing work by site/client.
    *   `project_id` (Primary Key)
    *   `project_name` (Text, Required)
    *   `project_address` (Text)
    *   `client_name` (Text)
    *   `user_id` (Foreign Key to Users table)

*   **`Trees` Table:** The central object of the platform.
    *   `tree_id` (Primary Key)
    *   `user_id` (Foreign Key)
    *   `project_id` (Foreign Key, nullable for personal trees)
    *   `species_name` (Text, Required)
    *   `scientific_name` (Text)
    *   `inaturalist_taxon_id` (Integer)
    *   `latitude` (Decimal, Required)
    *   `longitude` (Decimal, Required)
    *   `plus_code_global` (Text) #use the full 15 character plus code as is the case on soilgrower.com
    *   `plus_code_local` (Text)
    *   `planted_status` (Enum: 'Planted', 'Wild', 'Unknown')
    *   `date_planted_or_germinated` (Date)
    *   `height_cm` (Decimal)
    *   `dbh_cm` (Decimal, This is the FINAL calculated DBH)
    *   `canopy_spread_ns_m` (Decimal)
    *   `canopy_spread_ew_m` (Decimal)
    *   `is_multistem` (Boolean)
    *   `notes` (Text, for General Notes)
    *   `seed_source` (Text, nullable)
    *   `nursery_stock_id` (Text, nullable)
    *   `land_owner` (Text, nullable)

*   **`Assessments` Table:** A log of all observations for a tree over time.
    *   `assessment_id` (Primary Key)
    *   `tree_id` (Foreign Key)
    *   `user_id` (Foreign Key)
    *   `assessment_date` (Date, Required)
    *   `assessment_type` (Enum: 'Standard', 'Construction Monitoring', Required)
    *   **`data_json` (JSONB): A flexible field to store all structured checklist data and notes specific to this assessment. This is critical for scalability and prevents dozens of new columns per checklist item.**

*   **`Photos` Table:**
    *   `photo_id` (Primary Key)
    *   `tree_id` (Foreign Key)
    *   `assessment_id` (Foreign Key, nullable, links photos to a specific report)
    *   `photo_url` (Text, Required, pointing to cloud storage like S3)
    *   `caption` (Text, nullable)
    *   `upload_date` (Timestamp)

---

### III. The Data Entry Forms

This section details the UI and logic for each data entry form.

#### **Form 1: The Core Tree Record Form**

**Triggered by:** "Add Tree" button or "Edit Tree" button.
**UI/UX:** A single, scrollable page. The "Professional Data & Assessments" section should be a collapsible accordion or appear when a "Professional Mode" toggle is activated.

| Section | Field Label | Field Type | Details & Implementation Notes |
| :--- | :--- | :--- | :--- |
| **Project Assignment** | Select Project * | Dropdown | **Required.** Lists all projects created by the user. Default option: "Personal Inventory". |
| **Tree Details** | Species * | Searchable Input | **Required.** Integrated with iNaturalist API for auto-completion. Selecting a result auto-populates `Scientific Name` and `iNat Taxon ID`. |
| | Planted / Wild | Toggle | Toggling to `Planted` makes `Date Planted` required. Toggling to `Wild` makes it `Est. Germination Date` and optional. |
| | Date Planted | Date Picker | Required if `Planted`. |
| | General Notes | Text Area | For notes like "Bodie's birthplace tree." |
| **Location Info**| Latitude* / Longitude*| Read-only Number | **Required.** Populated by one of the buttons below. Values MUST be clickable links to an external map service (e.g., `http://maps.google.com/maps?q=loc:{lat},{lon}`). |
| | | Button | `📍 Current GPS` | Gets device location. Must display GPS accuracy. |
| | | Button | `🗺️ Pick on Map` | **CRITICAL:** Opens a **full-screen interactive map** for manual pin placement. Must offer **satellite view**. |
| **Measurements** | (Unit Display) | | *All labels in this section must dynamically show (ft/in) or (m/cm) based on user profile settings.* |
| | Height | Number Input | |
| | DBH | Number Input | This field becomes **read-only and auto-calculated** if "Multi-stem tree?" is checked. |
| | Multi-stem tree? | Checkbox | Checking this reveals the "Individual Stem Diameters" field. |
| | Individual Stem Diameters | Text Input | Placeholder: `e.g., 12.5, 15.3, 18.0`. User enters comma-separated values. On input, this must **auto-calculate and populate the DBH field** using the formula: `DBH = √(stem1² + stem2² + ...)` |
| | Canopy Spread N-S / E-W | Number Input | |
| **Management Data** | Professional Mode | Toggle Switch| (Default: OFF). Toggling ON reveals the sections below. |
| **Condition Assessment**| | `See Form 2 below`| |
| **Construction Monitoring**| | `See Form 3 below` | |
| **Photos** | `Photos` | File Upload | Native `[Camera]` and `[Gallery]` buttons. **Must show thumbnails of uploaded images with an optional caption field for each.** Backend must store files and link URLs to the `tree_id`. |

#### **Form 2: Professional Condition Assessment Module (Embedded in Core Form)**

**Purpose:** A detailed assessment of tree health, structure, and site conditions.

| Section | Checklist Item | Implementation Notes |
| :--- | :--- | :--- |
| **Structure** | `Co-dominant stems`, `Included bark`, `Weak branch attachments`, `Dead branches (>2 inches)`, `Broken branches`, `Cavity/decay`, `Root damage visible`, `Lean/instability`, `Girdling roots`, `Crown imbalance` | This is a multi-select checklist. For **each checked item**, a small text input field should dynamically appear next to it allowing for optional specific notes. For example, check `Cavity/decay` -> a text box appears -> user enters "Basal cavity on N side, 6in wide". |
| **Canopy Health** | `Leaf discoloration`, `Early leaf drop`, `Sparse foliage`, `Branch dieback`, `Epicormic sprouting`, `Stunted growth`, `Wilting symptoms`, `Abnormal leaf size`, `Premature autumn color`, `Crown transparency >50%` | Same "Checklist + Notes" hybrid logic. |
| **Pests & Diseases**| `Fungal infection visible`, `Bacterial signs`, `Insect damage`, `Boring insect holes`, `Scale insects`, `Aphid infestation`, `Cankers present`, `Powdery mildew`, `Rust disease`, `Viral symptoms` | Same "Checklist + Notes" hybrid logic. |
| **Site Conditions**| `Soil compaction`, `Poor drainage`, `Construction damage`, `Salt damage`, `Drought stress`, `Over-watering signs`, `Nutrient deficiency`, `Chemical damage`, `Mechanical damage`, `Inadequate planting space` | Same "Checklist + Notes" hybrid logic. |
| **Summary** | Arborist Summary | This is a required large text area for a professional narrative, synthesizing the checklist findings and making final recommendations. |

#### **Form 3: Construction Monitoring Report**

**Purpose:** A specialized, recurring report form for tracking trees within a designated construction project. Accessed via the Tree Details page.

| Section | Field | Type | Options |
| :--- | :--- | :--- | :--- |
| **TPZ & CRZ Status** | TPZ Fencing | Dropdown | `TPZ fencing in good condition`, `TPZ fencing partially in place`, `TPZ fencing needs attention`, `TPZ fencing not installed`, `Other` |
| | TPZ Incursions| Dropdown | `No TPZ incursions`, `TPZ partial incursion`, `TPZ excessive incursions`, `Other` |
| | TPZ Mulch | Dropdown | `Mulch in place`, `Mulch partially in place`, `Mulch needs replacement`, `Mulch not installed`, `Other` |
| **Tree Health** | Overall Condition | Dropdown | `Excellent`, `Good`, `Fair`, `Poor`, `Dead` |
| | Canopy Density | Dropdown | `Full`, `Medium`, `Low`, `Other` |
| | Canopy Color | Dropdown | `Vibrant`, `Dull`, `Yellowing`, `Browning` |
| | Canopy Dieback| Dropdown | `None`, `Minor`, `Moderate`, `Significant`, `Excessive` |
| | Canopy Impact | Dropdown | `None`, `Minor Damage`, `Moderate Damage`, `Significant Damage` |
| | Rootzone Notes| Multi-Select Checklist | `Protected`, `Minor Compaction`, `Moderate Compaction`, `Significant Compaction`, `Excessive Compaction`, `Minor Fill`, `Moderate Fill`, `Significant Fill`, `Excessive Fill`, `Adequate Moisture`, `Ponding`, `Dry`, `Very Dry` |
| **Narrative**| Notes & Rec. Action | Large Text Area| **Required.** For a detailed narrative of the site visit. |

---

### IV. PDF Report Generation

**Objective:** To allow users to generate professional, client-ready reports from the assessment data.

*   **Header:** Branded with Arboracle logo, report title ("Tree Assessment Report"), Project Name, and Address.
*   **Summary Box:** A high-level overview including Tree Species, DBH, Height, and Overall Condition Rating.
*   **Photographs:** A dedicated section displaying all attached photos with their captions in a clean grid.
*   **Assessment Details:** A well-formatted list of all the selections from the **Professional Condition Assessment** checklists, including any specific notes entered.
*   **Arborist Summary:** The full narrative from the summary text field.
*   **Footer:** Assessor's Name, Date of Assessment, and Page Number.

This comprehensive brief provides the exact specifications needed. By focusing on these concrete requirements, we will build an unshakable, professional, and AI-ready platform. Let's make this happen.


# SUPERSEDED, DO NOT USE

> This file is an **earlier draft** of the assessment-forms brief. The canonical
> version is [`09_FEATURE_BRIEF_ASSESSMENT_FORMS.md`](09_FEATURE_BRIEF_ASSESSMENT_FORMS.md)
> (Document Version 3.0, 146 lines, which self-declares as the "single source of
> truth for all data collection forms"). This draft is 140 lines and predates it.
>
> Two files with near-identical names and different content is an implementer
> trap: nothing in the test suite would catch someone building from the wrong
> one. Kept for provenance, not for use. Flagged by Hermes 2026-10-13 during the
> OpenArbor strategic-spec review. Safe to trash after 7 days if unreferenced.

---

# **Feature Brief: Arborist Assessment Forms**

## **1\. Tree Assessment Fields**

This section details the exact fields required for a comprehensive tree assessment.

### **Basic Tree Information**

* **Tree ID:** Unique identifier for the tree.  
* **Species:**  
  * Common Name (e.g., "Coast Live Oak")  
  * Scientific Name (e.g., "Quercus agrifolia")  
* **Location:**  
  * GPS Coordinates (Latitude, Longitude)  
  * Address/Site Name (e.g., "123 Main St, Anytown" or "City Park \- North Section")  
* **Date of Assessment:** Date the assessment was conducted.  
* **Assessor Name:** Name of the arborist performing the assessment.

### **Physical Characteristics**

* **Height:** (ft/m)  
* **Diameter at Breast Height (DBH):** (inches/cm)  
* **Crown Spread:** (ft/m)  
* **Bark Condition:** (e.g., Smooth, Fissured, Peeling, Cracking, Discolored, Presence of wounds/cankers)  
* **Leaf/Needle Condition:** (e.g., Healthy green, Chlorotic, Necrotic, Wilting, Sparse, Discolored, Abnormal size/shape)  
* **Branch Structure:** (e.g., Strong attachments, Included bark, Crossing branches, Deadwood, Broken branches, Epicormic growth)  
* **Root Collar/Root System Health:** (e.g., Girdling roots, Root decay, Soil compaction, Exposed roots, Fungal fruiting bodies)  
* **Presence of visible defects:** (e.g., cracks, cavities, cankers, wounds, conks, weak unions, decay)

### **Health & Vigor**

* **Overall Vigor Rating:** (e.g., Poor, Fair, Good, Excellent)  
* **Pest/Disease Presence:**  
  * Type (e.g., Aphids, Powdery Mildew, Canker, Borers)  
  * Severity (e.g., Low, Moderate, High, Extensive)  
* **Nutrient Deficiencies:** (e.g., Iron chlorosis, Nitrogen deficiency)  
* **Water Stress Indicators:** (e.g., Leaf scorch, Premature leaf drop, Wilting)

### **Site Conditions**

* **Soil Type:** (e.g., Clay, Loam, Sand, Rocky)  
* **Drainage:** (e.g., Good, Poor, Standing water)  
* **Sun Exposure:** (e.g., Full sun, Partial shade, Full shade)  
* **Surrounding Vegetation:** (e.g., Lawn, Shrubs, Other trees, Groundcover)  
* **Proximity to structures/utilities:** (e.g., Buildings, Fences, Overhead power lines, Underground pipes)  
* **Presence of impervious surfaces:** (e.g., Pavement, Concrete, Buildings)

### **Risk Assessment**

* **Target Zone:** Area where failure would impact (e.g., High use area, Low use area, Structure, Roadway).  
* **Likelihood of Failure:** (e.g., Improbable, Possible, Probable, Imminent).  
* **Impact of Failure:** (e.g., Negligible, Minor, Significant, Severe).  
* **Risk Rating:** (e.g., Low, Moderate, High, Extreme).

### **Recommendations**

* **Pruning Needs:** (e.g., Deadwood removal, Crown thinning, Crown reduction, Structural pruning)  
* **Pest/Disease Management:** (e.g., Integrated Pest Management, Fungicide application, Biological control)  
* **Fertilization:** (e.g., Soil amendment, Specific nutrient application)  
* **Watering:** (e.g., Deep watering, Irrigation system adjustment)  
* **Cabling/Bracing:** (e.g., Installation, Inspection, Removal)  
* **Removal:** (e.g., Justification, Method)  
* **Monitoring Schedule:** (e.g., Annual, Biannual, Quarterly)  
* **Follow-up Actions:** Specific tasks or next steps.

### **Photographs**

* Ability to attach multiple images with captions for each photo.

## **2\. Checklist \+ Notes Hybrid Model Logic**

This section explains the logic for the "Checklist \+ Notes" hybrid model for data entry.

* Each major assessment category (e.g., Bark Condition, Leaf Condition, Pest/Disease Presence) should have a predefined checklist of common conditions or findings.  
* Alongside each checklist item, there should be a free-form text area for detailed notes, observations, or specific measurements. This allows arborists to quickly select common issues while also providing granular, context-specific details.  
* The system should allow for adding custom checklist items on the fly if a predefined option is not sufficient for a unique observation.  
* The notes section should support rich text formatting (bold, italics, bullet points, numbered lists) to enhance readability and organization of observations.

## **3\. Form UI Mockups/Wireframes (Conceptual Description)**

This section provides a conceptual description of the form's UI layout and user flow.

* **Overall Organization:** The form should be organized into logical, distinct sections, mirroring the categories outlined in Section 1 (e.g., "General Info", "Physical Assessment", "Health & Pest", "Risk", "Recommendations").  
* **Layout Elements:**  
  * Use of clear, prominent headings and subheadings for each section and subsection.  
  * Expandable/collapsible sections should be implemented for longer forms to improve navigability and reduce visual clutter, allowing users to focus on relevant sections.  
* **Input Field Types:**  
  * **Textboxes:** For free-form text input (e.g., Assessor Name, Notes).  
  * **Dropdowns:** For predefined lists (e.g., Species Common Name, Overall Vigor Rating, Soil Type, Risk Rating components).  
  * **Date Pickers:** For selecting dates (e.g., Date of Assessment).  
  * **Number Inputs:** For numerical values (e.g., Height, DBH, Crown Spread).  
  * **File Upload:** Specifically for photographs, allowing multiple image attachments per assessment with associated caption fields.  
* **Navigation:** Clear navigation between sections should be provided, such as "Next" and "Previous" buttons at the bottom of each section, or a persistent sidebar navigation menu that allows direct jumps to any section.  
* **Action Buttons:** Prominently display "Save Draft" (to save incomplete assessments) and "Submit" (to finalize and submit a complete assessment) buttons.  
* **Required Fields:** Visual indicators (e.g., asterisk, red border) should clearly mark all required input fields to ensure complete data capture.

## **4\. PDF Report Format**

This section outlines the required format for the PDF report that will be generated from this assessment form.

* **Header:** Professional, branded header with the company logo (Arboracle), report title (e.g., "Tree Assessment Report"), and potentially the tree's ID or site name.  
* **Table of Contents:** For longer reports, an automatically generated table of contents to facilitate navigation.  
* **Summary Section:** A concise summary section at the beginning, highlighting key findings, overall tree health, and primary recommendations.  
* **Detailed Sections:** Comprehensive sections mirroring the form's structure, presenting all captured data clearly and legibly. This includes all basic information, physical characteristics, health, site conditions, risk assessment, and recommendations.  
* **Photographs:** Inclusion of all attached photographs within the relevant sections of the report, each accompanied by its caption.  
* **Risk Assessment Presentation:** Clear and intuitive presentation of risk assessment results, potentially using a matrix, color-coded system (e.g., green for low, red for high), or graphical representation.  
* **Recommendations Section:** A dedicated, actionable section for recommendations, clearly outlining steps, priorities, and any associated costs or timelines.  
* **Footer:** Consistent footer on each page including page numbers, the date of the report generation, and assessor contact information.  
* **Export Options:** Provide options to export both a detailed, comprehensive report (including all data and photos) and a summary report (focused on key findings and recommendations only).

## **5\. Implementation Guidance for AI Agent Dev Team**

This section provides critical implementation guidance for the AI agent development team.

* **Data Validation:** Implement robust, client-side and server-side data validation for all input fields to ensure data integrity and prevent errors. This includes type checking, range validation, and format validation (e.g., for GPS coordinates).  
* **GPS Integration:** Seamless integration points for GPS location services (e.g., mobile device GPS, manual input with map picker) for accurate tree location capture. Consider accuracy levels and error handling for GPS data.  
* **Scalability:** Design the backend and database schema for scalability to efficiently store and retrieve large numbers of assessments and associated media (photographs). Consider cloud storage solutions for media assets.  
* **Security Measures:** Implement stringent security measures for sensitive client or location data, including data encryption (at rest and in transit), access controls, and regular security audits. Adhere to relevant data privacy regulations (e.g., GDPR, CCPA).  
* **User Authentication and Authorization:** Implement robust user authentication and authorization mechanisms for form access, data submission, and report generation. Different user roles (e.g., arborist, administrator) may require different permissions.  
* **Offline Capabilities:** Consider and implement offline capabilities for field assessments, allowing arborists to capture data without continuous internet connectivity. Data should sync automatically once connectivity is restored.  
* **Version Control:** Implement version control for assessment forms and templates to track changes, allow rollbacks, and manage different versions of forms over time.  
* **API Design:** Design a clean, well-documented, and RESTful API for seamless integration with other Arboracle modules (e.g., "My Trees" inventory, analytics dashboards). Ensure API endpoints are secure and performant.  
* **External Database Integrations:** Plan for future integrations with external databases (e.g., comprehensive species databases, pest/disease registries) to enrich assessment data and provide real-time information.  
* **Performance Optimization:** Optimize the application for performance, especially for loading large forms, handling numerous photo uploads, and generating complex reports quickly.  
* **Accessibility (ADA Compliance):** Ensure all UI elements and user flows are designed and implemented with accessibility (ADA compliance) in mind, supporting users with disabilities.  
* **Error Handling and User Feedback:** Implement comprehensive error handling mechanisms and provide clear, actionable user feedback for all interactions and potential issues (e.g., validation errors, submission failures).  
* **Database Schema Design Recommendations:**  
  * **Trees Table:** TreeID (PK), SpeciesCommonName, SpeciesScientificName, Latitude, Longitude, Address, SiteName, DateAdded, AddedByUserID.  
  * **Assessments Table:** AssessmentID (PK), TreeID (FK), AssessmentDate, AssessorUserID (FK), OverallVigorRating, SoilType, Drainage, SunExposure, ProximityToStructures, ImperviousSurfaces, TargetZone, LikelihoodOfFailure, ImpactOfFailure, RiskRating, PruningNeeds, PestDiseaseManagement, Fertilization, Watering, CablingBracing, Removal, MonitoringSchedule, FollowUpActions.  
  * **PhysicalCharacteristics Table:** PhysicalCharID (PK), AssessmentID (FK), Height, DBH, CrownSpread, BarkConditionNotes, LeafConditionNotes, BranchStructureNotes, RootSystemHealthNotes, VisibleDefectsNotes.  
  * **HealthVigor Table:** HealthVigorID (PK), AssessmentID (FK), PestDiseaseType, PestDiseaseSeverity, NutrientDeficiencies, WaterStressIndicators.  
  * **ChecklistItems Table:** ChecklistItemID (PK), Category (e.g., 'BarkCondition'), ItemText, IsPredefined (Boolean).  
  * **AssessmentChecklist Table (Junction Table for Checklist \+ Notes):** AssessmentChecklistID (PK), AssessmentID (FK), ChecklistItemID (FK), FreeFormNotes (Rich Text), CustomItemText (if IsPredefined=False).  
  * **Photos Table:** PhotoID (PK), AssessmentID (FK), ImageURL, Caption, Timestamp.  
* **Testing Strategy:** Develop a robust testing strategy including:  
  * **Unit Testing:** For individual components and functions.  
  * **Integration Testing:** For API endpoints and module interactions.  
  * **User Acceptance Testing (UAT):** Involving arborists and end-users to validate functionality against real-world use cases.  
* **Deployment Considerations:** Plan for secure and efficient deployment, including staging and production environments, CI/CD pipelines, and rollback strategies.  
* **Monitoring and Logging:** Implement comprehensive monitoring and logging for form usage, system performance, and errors to facilitate troubleshooting and continuous improvement.  
* **Internationalization (i18n) and Localization (l10n):** Design the system with i18n and l10n in mind for future expansion into different languages and regional standards (e.g., unit conversions for measurements).
/**
 * Open Arbor Alliance v2.0 (41-Tool Forestry Workbench UI: web/pages/tools-ui.js)
 * Combines the 4 Open Arbor Core ESM Engines with the 33 scientific forestry tools
 * and 4 supporting geospatial applications from data/catalog/forestry-tools.json.
 * Zero em dashes, zero en dashes, zero exclamation points, zero AI filler vocabulary.
 */

import forestryToolsCatalog from '../../data/catalog/forestry-tools.json';

/**
 * 4 Open Arbor Core Browser/Node ESM Engines
 */
const CORE_ESM_TOOLS = [
  {
    id: 'openarbor-rootzone-esm',
    name: 'rootZone.js (Open Arbor Core ESM)',
    group: 'core-esm',
    domain: 'CRZ, TPZ, SRZ & Multi-Stem Geometry',
    upstream_url: 'https://github.com/Arboracle-Ecosystem/openarbor/blob/main/src/core/rootZone.js',
    license: 'AGPL-3.0-or-later',
    language: 'JavaScript (ESM)',
    packagingTier: 'Core Browser/Node ESM',
    evidenceGrade: 'Workflow-qualified',
    isCoreEsm: true,
    formats: ['JSON', 'SVG', 'GeoJSON (OGC CRS84)'],
    tags: ['ansi-a300', 'as-4970', 'bs-5837', 'crz', 'srz', 'tpz', 'mattheck', 'multi-stem'],
    summary:
      'Deterministic Critical Root Zone (CRZ), Tree Protection Zone (TPZ), and AS 4970 / Mattheck Structural Root Zone (SRZ) calculator with multi-stem DBH aggregation and 1-ft grid union area modeling.',
    citation:
      'ANSI A300 (Part 5); ISA Best Management Practices: Managing Trees During Construction; Standards Australia AS 4970-2009; British Standard BS 5837:2012; Mattheck & Breloer (1994).',
    recipe: `# Execute directly in Node.js >= 20 or import in browser ESM
npx openarbor-rca evaluate --dbh-in 28 --drf-in 34 --jurisdiction tx-austin
node -e "import('./src/core/rootZone.js').then(m => console.log(m.calculateRootZones({ dbhInches: 28, rootFlareDiameterInches: 34 })))"`,
    bridgeTargetPaths: [
      'structural_baseline.dbh_cm',
      'structural_baseline.multistem_aggregation_method',
      'rhizosphere_and_root_collar.crz_radius_m',
      'rhizosphere_and_root_collar.srz_radius_m',
      'rhizosphere_and_root_collar.tiz_radius_m',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.tiz_footprint_area_m2',
    ],
    bridgeSnippet: {
      structural_baseline: {
        dbh_cm: 71.1,
        is_multistem: false,
        multistem_aggregation_method: 'single_stem',
      },
      rhizosphere_and_root_collar: {
        root_flare_diameter_cm: 86.4,
        crz_radius_m: 8.53,
        srz_radius_m: 3.12,
        tiz_radius_m: 11.4,
      },
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          sanctuary_scorecard_targets: {
            tiz_footprint_area_m2: 408.28,
          },
        },
      },
    },
  },
  {
    id: 'openarbor-ordinance-esm',
    name: 'ordinanceEngine.js (Open Arbor Core ESM)',
    group: 'core-esm',
    domain: 'Declarative Municipal Tree Code & Oak Wilt Engine',
    upstream_url: 'https://github.com/Arboracle-Ecosystem/openarbor/blob/main/src/core/ordinanceEngine.js',
    license: 'AGPL-3.0-or-later',
    language: 'JavaScript (ESM)',
    packagingTier: 'Core Browser/Node ESM',
    evidenceGrade: 'Workflow-qualified',
    isCoreEsm: true,
    formats: ['JSON (municipal-ordinance.schema.json)', 'Markdown Report'],
    tags: ['ordinance', 'mitigation', 'oak-wilt', 'austin-ldc', 'ashland-amc', 'heritage-tree'],
    summary:
      'Data-driven municipal protection classifier, tiered mitigation fee calculator, replacement tree scheduler, and Ceratocystis fagacearum (Oak Wilt) seasonal vector restriction evaluator across Central Texas and Rogue Valley, Oregon.',
    citation:
      'Austin LDC Chapter 25-8 & ECM Section 3; Georgetown UDC Chapter 8; Liberty Hill UDC Section 6.07.01; Ashland AMC 18.4.5; Medford MMC 6.700; Grants Pass Development Code Art. 13.',
    recipe: `# Validate municipal ordinance records and run compliance audit
npm run validate:ordinances
node -e "import('./src/core/ordinanceEngine.js').then(m => console.log(Object.keys(m)))"`,
    bridgeTargetPaths: [
      'structural_baseline.municipal_permit_disposition.jurisdiction_id',
      'structural_baseline.municipal_permit_disposition.ordinance_citation',
      'structural_baseline.municipal_permit_disposition.protection_tier',
      'structural_baseline.municipal_permit_disposition.permit_required',
      'structural_baseline.municipal_permit_disposition.recommended_disposition',
      'structural_baseline.municipal_permit_disposition.seasonal_oak_wilt_restriction_active',
    ],
    bridgeSnippet: {
      structural_baseline: {
        municipal_permit_disposition: {
          jurisdiction_id: 'tx-austin',
          ordinance_citation: 'City of Austin LDC Title 25, Chapter 25-8, Subchapter B; ECM Section 3',
          protection_tier: 'Heritage',
          permit_required: true,
          recommended_disposition: 'Preservation_With_Rhizosphere_Remediation',
          seasonal_oak_wilt_restriction_active: true,
        },
      },
    },
  },
  {
    id: 'openarbor-benefits-esm',
    name: 'ecosystemBenefits.js (Open Arbor Core ESM)',
    group: 'core-esm',
    domain: 'Allometric Carbon, Stormwater & John White Veteran Age',
    upstream_url: 'https://github.com/Arboracle-Ecosystem/openarbor/blob/main/src/core/ecosystemBenefits.js',
    license: 'AGPL-3.0-or-later',
    language: 'JavaScript (ESM)',
    packagingTier: 'Core Browser/Node ESM',
    evidenceGrade: 'Workflow-qualified',
    isCoreEsm: true,
    formats: ['GeoJSON (OGC CRS84)', 'JSON', 'CSV'],
    tags: ['allometry', 'nowak', 'mcpherson', 'xiao-stormwater', 'john-white-age', 'geojson'],
    summary:
      'Peer-reviewed urban forestry allometrics computing biomass carbon storage, annual CO2 sequestration, rainfall interception, cooling energy savings, John White FCIN12 veteran tree age, and OGC CRS84 GeoJSON export.',
    citation:
      'Nowak (1994); Cairns et al. (1997); Xiao et al. (2000); Nowak et al. (2006); McPherson & Simpson (1999); White (1998) Forestry Commission Information Note FCIN12.',
    recipe: `# Compute ecosystem services and export OGC CRS84 GeoJSON
node -e "import('./src/core/ecosystemBenefits.js').then(m => console.log(m.estimateEcosystemBenefits({ dbhInches: 30, species: 'Quercus virginiana' })))"`,
    bridgeTargetPaths: [
      'structural_baseline.dual_valuation.ctla_10th_ed_depreciated_usd',
      'structural_baseline.dual_valuation.holobiont_200yr_biological_equity_usd',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.canopy_projection_area_m2',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.stormwater_interception_baseline_liters_yr',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.stormwater_interception_target_liters_yr',
    ],
    bridgeSnippet: {
      structural_baseline: {
        dual_valuation: {
          ctla_10th_ed_depreciated_usd: 14850,
          holobiont_200yr_biological_equity_usd: 46200,
          veteran_keystone_habitat_multiplier: 2.4,
          valuation_delta_usd: 31350,
        },
      },
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          sanctuary_scorecard_targets: {
            canopy_projection_area_m2: 153.94,
            stormwater_interception_baseline_liters_yr: 11420,
            stormwater_interception_target_liters_yr: 16850,
          },
        },
      },
    },
  },
  {
    id: 'openarbor-rca-esm',
    name: 'rcaEngine.js (Open Arbor Core ESM)',
    group: 'core-esm',
    domain: 'RCA-Spec v2.0 Diagnostic, CODIT, Mattheck t/R & Holobiont Equity',
    upstream_url: 'https://github.com/Arboracle-Ecosystem/openarbor/blob/main/src/core/rcaEngine.js',
    license: 'AGPL-3.0-or-later',
    language: 'JavaScript (ESM)',
    packagingTier: 'Core Browser/Node ESM',
    evidenceGrade: 'Workflow-qualified',
    isCoreEsm: true,
    formats: ['JSON (rca_assessment.schema.json)', 'Markdown Report', 'SVG Site Map'],
    tags: ['rca-v2', 'codit', 'shigo', 'mattheck', 'airspade', 'soil-health-index', 'sanctuary-scorecard'],
    summary:
      'Regenerative Consulting Arborist (RCA-Spec v2.0) diagnostic engine evaluating Shigo CODIT wall response, Mattheck t/R shell buckling safety, pneumatic AirSpade trench geometry, soil microbiome health index, and Sanctuary Scorecard 5-year rollups.',
    citation:
      'Shigo & Marx (1977) CODIT USDA Info Bulletin 405; Mattheck & Breloer (1994); Smiley (2008) AirSpade Root Collar Excavation; Gann et al. (2019) SER Standards; Newton et al. (2020).',
    recipe: `# Run full RCA-Spec v2.0 diagnostic verification suite
npm test
node tests/verify_openarbor.mjs`,
    bridgeTargetPaths: [
      'structural_baseline.codit_wall_response_rating',
      'structural_baseline.sound_shell_thickness_ratio_t_over_r',
      'rhizosphere_and_root_collar.airspade_radial_trenching_geometry',
      'soil_and_microbiome_baseline.mycorrhizal_and_fungal_observations',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.soil_health_index_baseline_score',
    ],
    bridgeSnippet: {
      schema_version: 'RCA_v2',
      assessment_mode: 'Regenerative Diagnostic',
      structural_baseline: {
        codit_wall_response_rating: 'Strong Wall 4 barrier zone formation; active woundwood roll at 8.5 mm/yr',
        sound_shell_thickness_ratio_t_over_r: 0.36,
      },
      rhizosphere_and_root_collar: {
        root_flare_burial_depth_cm: 14,
        stem_girdling_root_count: 2,
        stem_girdling_root_severity: 'Moderate_25_To_50_Pct_Circumference',
      },
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          sanctuary_scorecard_targets: {
            soil_health_index_baseline_score: 54,
            soil_health_index_target_score: 84,
          },
        },
      },
    },
  },
];

/**
 * Metadata enrichment lookup keyed by tool id for literature citations, file formats,
 * sovereign execution recipes, and exact RCA_v2 schema bridge mappings.
 */
const TOOL_BRIDGE_METADATA = {
  qgis: {
    language: 'C++ / Python (PyQGIS)',
    formats: ['GeoPackage (.gpkg)', 'GeoJSON', 'Shapefile', 'GeoTIFF', 'LAZ/COPC'],
    citation: 'QGIS Development Team (2026). QGIS Geographic Information System. Open Source Geospatial Foundation Project.',
    recipe: `# Install distro-qualified QGIS LTR package on Ubuntu / Debian
sudo apt-get update && sudo apt-get install -y qgis python3-qgis
# Open exported Open Arbor OGC CRS84 GeoJSON parcel layer
qgis --project openarbor_sanctuary_parcel.qgz openarbor_trees_crs84.geojson`,
    bridgePaths: [
      'structural_baseline.plus_code_global',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.tiz_footprint_area_m2',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.canopy_projection_area_m2',
    ],
    sampleOutput: {
      structural_baseline: {
        plus_code_global: '86247784+PJ',
        crown_spread_ns_m: 14.2,
        crown_spread_ew_m: 13.8,
      },
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          sanctuary_scorecard_targets: {
            tiz_footprint_area_m2: 380.13,
            canopy_projection_area_m2: 153.91,
          },
        },
      },
    },
  },
  gdal: {
    language: 'C / C++ / Python CLI',
    formats: ['GeoJSON', 'GeoTIFF', 'GPKG', 'FlatGeobuf', 'CSV'],
    citation: 'GDAL/OGR Contributors (2026). GDAL/OGR Geospatial Data Abstraction software Library. Open Source Geospatial Foundation.',
    recipe: `# Install host GDAL utilities and verify CRS84 GeoJSON conformance
sudo apt-get install -y gdal-bin
ogrinfo -al -so openarbor_trees_crs84.geojson
ogr2ogr -f "GPKG" sanctuary_inventory.gpkg openarbor_trees_crs84.geojson -nln rca_trees`,
    bridgePaths: [
      'structural_baseline.plus_code_global',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.tiz_footprint_area_m2',
    ],
    sampleOutput: {
      structural_baseline: {
        plus_code_global: '86247784+PJ',
        tree_tag: 'OA-GPKG-104',
      },
    },
  },
  cloudcompare: {
    language: 'C++ (Qt Desktop & CLI)',
    formats: ['LAS', 'LAZ', 'E57', 'PLY', 'PCD', 'OBJ'],
    citation: 'Girardeau-Montaut, D. (2016). CloudCompare: 3D point cloud and mesh processing software. EDF R&D / Telecom ParisTech.',
    recipe: `# Run CloudCompare in headless silent mode to subsample a terrestrial LiDAR scan
sudo apt-get install -y cloudcompare
CloudCompare -SILENT -O tree_scan_raw.laz -C_EXPORT_FMT LAS -SS SPATIAL 0.01 -SAVE_CLOUDS`,
    bridgePaths: [
      'structural_baseline.dbh_cm',
      'structural_baseline.height_m',
      'rhizosphere_and_root_collar.root_flare_diameter_cm',
    ],
    sampleOutput: {
      structural_baseline: {
        dbh_cm: 68.4,
        height_m: 19.6,
      },
      rhizosphere_and_root_collar: {
        root_flare_diameter_cm: 89.2,
      },
    },
  },
  'forest-search': {
    language: 'Python (uv + sqlite-vec + Ollama)',
    formats: ['SQLite (.db)', 'Markdown', 'JSONL', 'MCP Stdio'],
    citation: 'STIM Protocol Contributors (2026). Forest Search & Semantic Index for Local Ecological Knowledge Commons.',
    recipe: `# Query local sovereign literature and municipal rules over stdio
uv run --project /home/george/Myceliate_Master/UNDERSTORY/forest-search python -m forest_search query "Mattheck t/R hollow shell threshold"`,
    bridgePaths: [
      'outcome_monitoring_schedule.stim_hypothesis_statement',
      'outcome_monitoring_schedule.stim_kill_criterion',
    ],
    sampleOutput: {
      outcome_monitoring_schedule: {
        stim_hypothesis_statement:
          'Pneumatic root collar excavation to 14 cm depth plus 8 radial biochar-compost trenches will reduce topsoil bulk density below 1.25 g/cm3 within 24 months.',
        stim_kill_criterion:
          'Falsified if 12-month terminal shoot extension remains below 5 cm/yr or upper canopy dieback exceeds 15 percent.',
      },
    },
  },
  qfield: {
    language: 'C++ / QML (Qt / QGIS Mobile)',
    formats: ['QGS / QGZ', 'GeoPackage (.gpkg)', 'GeoJSON', 'JPEG (Geotagged)'],
    citation: 'OPENGIS.ch (2025). QField: Mobile GIS data collection for QGIS. https://qfield.org',
    recipe: `# Package QGIS project for offline tablet field collection
flatpak install -y flathub ch.opengis.qfield
flatpak run ch.opengis.qfield --project sanctuary_field_survey.qgz`,
    bridgePaths: [
      'structural_baseline.tree_tag',
      'structural_baseline.plus_code_global',
      'structural_baseline.assessment_date',
      'outcome_monitoring_schedule.one_year_leading_indicators.fixed_photopoint_azimuth_deg',
    ],
    sampleOutput: {
      structural_baseline: {
        tree_tag: 'QF-ASH-042',
        plus_code_global: '84QV57VR+R6',
        assessment_date: '2026-10-29',
      },
      outcome_monitoring_schedule: {
        one_year_leading_indicators: {
          fixed_photopoint_azimuth_deg: 185,
        },
      },
    },
  },
  opentreemap: {
    language: 'Python / Django / PostGIS',
    formats: ['PostgreSQL / PostGIS', 'CSV', 'GeoJSON'],
    citation: 'Azavea & OpenTreeMap Contributors (2022). OpenTreeMap Collaborative Urban Forest Inventory Platform.',
    recipe: `# Containerized sidecar inspection (requires license & maintenance review before launch)
docker compose -f docker/opentreemap-sidecar.yml config
# Export existing OTM table into Open Arbor RCA_v2 migration format
pg_dump -t treemap_tree --csv otm_db > otm_trees_export.csv`,
    bridgePaths: [
      'structural_baseline.species_scientific',
      'structural_baseline.species_common',
      'structural_baseline.dbh_cm',
    ],
    sampleOutput: {
      structural_baseline: {
        species_scientific: 'Quercus garryana',
        species_common: 'Oregon White Oak',
        dbh_cm: 61.0,
      },
    },
  },
  canopywatch: {
    language: 'HTML5 / JavaScript (Leaflet Static)',
    formats: ['GeoJSON', 'HTML', 'CSV'],
    citation: 'Meyering, N. (2024). CanopyWatch: Open Urban Canopy Equity Visualization.',
    recipe: `# Serve local CanopyWatch static bundle with local parcel GeoJSON overlay
python3 -m http.server 8090 --directory ./vendor/canopy-watch`,
    bridgePaths: [
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.canopy_projection_area_m2',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.restoration_potential_baseline_pct',
    ],
    sampleOutput: {
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          sanctuary_scorecard_targets: {
            canopy_projection_area_m2: 142.5,
            restoration_potential_baseline_pct: 48,
            restoration_potential_realized_pct: 78,
          },
        },
      },
    },
  },
  treels: {
    language: 'R / C++ (Rcpp)',
    formats: ['LAS', 'LAZ', 'CSV', 'RDS'],
    citation: 'de Conto, T., et al. (2017). Performance of stem denoising and stem modelling algorithms on single tree point clouds from terrestrial laser scanning. Computers and Electronics in Agriculture, 143, 165-176.',
    recipe: `# Run TreeLS inside reproducible renv container sidecar
docker run --rm -v "$PWD:/data" openarbor/renv-lidar:latest Rscript -e "
  library(TreeLS); tls <- readTLS('/data/stem_scan.laz');
  inv <- tlsInventory(tls, d_method = shapeFit(shape = 'circle', algorithm = 'ransac'));
  write.csv(inv, '/data/treels_dbh.csv', row.names = FALSE)"`,
    bridgePaths: [
      'structural_baseline.dbh_cm',
      'structural_baseline.height_m',
      'rhizosphere_and_root_collar.root_flare_diameter_cm',
    ],
    sampleOutput: {
      structural_baseline: {
        dbh_cm: 58.2,
        height_m: 18.4,
      },
      rhizosphere_and_root_collar: {
        root_flare_diameter_cm: 74.6,
      },
    },
  },
  '3dfin': {
    language: 'Python (Open3D / NumPy / PyQt6)',
    formats: ['LAS', 'LAZ', 'XYZ', 'CSV'],
    citation: 'Laino, D., Cabo, C., et al. (2024). 3DFin: A software for automated 3D forest inventory from terrestrial and personal laser scanning point clouds. Forestry: An International Journal of Forest Research.',
    recipe: `# Create dedicated uv virtual environment and run 3DFin CLI stem profile extraction
uv venv .venv-3dfin --python 3.11
uv pip install --python .venv-3dfin 3dfin open3d laspy
.venv-3dfin/bin/3dfin cli --input plot_scan.laz --output 3dfin_inventory.csv --z-min 0.3 --z-max 15.0`,
    bridgePaths: [
      'structural_baseline.dbh_cm',
      'structural_baseline.height_m',
      'structural_baseline.stem_diameters_cm',
      'rhizosphere_and_root_collar.root_flare_diameter_cm',
    ],
    sampleOutput: {
      structural_baseline: {
        dbh_cm: 64.8,
        is_multistem: false,
        height_m: 21.3,
        live_crown_ratio_pct: 62,
      },
      rhizosphere_and_root_collar: {
        root_flare_diameter_cm: 83.5,
      },
    },
  },
  treeseg: {
    language: 'C++ (Point Cloud Library / PCL)',
    formats: ['PCD', 'LAS', 'ASCII XYZ'],
    citation: 'Burt, A., Disney, M., & Calders, K. (2019). Extracting individual trees from lidar point clouds using treeseg. Methods in Ecology and Evolution, 10(3), 438-445.',
    recipe: `# Execute compiled native TreeSeg binary on high-density TLS plot scan
findstems plot_slice.pcd 1.3 0.15
segmentcrown plot_stems.pcd 12.0`,
    bridgePaths: [
      'structural_baseline.dbh_cm',
      'structural_baseline.crown_spread_ns_m',
      'structural_baseline.crown_spread_ew_m',
    ],
    sampleOutput: {
      structural_baseline: {
        dbh_cm: 72.1,
        crown_spread_ns_m: 15.6,
        crown_spread_ew_m: 14.9,
      },
    },
  },
  treeqsm: {
    language: 'MATLAB / GNU Octave',
    formats: ['MAT', 'TXT / XYZ', 'JSON (Cylinder QSM)'],
    citation: 'Raumonen, P., et al. (2013). Fast Automatic Precision Tree Models from Terrestrial Laser Scanner Data. Remote Sensing, 5(2), 491-520.',
    recipe: `# Note: Octave/MATLAB compatibility requires verification per release; inspect source cylinder output
octave-cli --eval "addpath(genpath('src')); create_input; QSM = treeqsm(P, inputs); save('-v7', 'qsm_out.mat', 'QSM');"`,
    bridgePaths: [
      'structural_baseline.dbh_cm',
      'structural_baseline.height_m',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.canopy_volume_expansion_target_pct',
    ],
    sampleOutput: {
      structural_baseline: {
        dbh_cm: 79.4,
        height_m: 24.1,
      },
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          sanctuary_scorecard_targets: {
            canopy_volume_expansion_target_pct: 18.5,
          },
        },
      },
    },
  },
  simpleforest: {
    language: 'C++ (CloudCompare Plugin / PCL)',
    formats: ['PLY', 'CSV (Cylinder Allometry)', 'LAS'],
    citation: 'Hackenberg, J., et al. (2015). SimpleTree: An Efficient Open Source Tool to Build Tree Models from TLS Clouds. Forests, 6(11), 4245-4294.',
    recipe: `# Launch CloudCompare with SimpleForest QSM plugin enabled for desktop cylinder inspection
cloudcompare -O isolated_tree.ply`,
    bridgePaths: [
      'structural_baseline.dbh_cm',
      'structural_baseline.isa_traq_risk.primary_tree_part_of_concern',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.canopy_volume_expansion_target_pct',
    ],
    sampleOutput: {
      structural_baseline: {
        dbh_cm: 66.0,
        isa_traq_risk: {
          primary_tree_part_of_concern: 'Scaffold_Branch',
        },
      },
    },
  },
  pytlidar: {
    language: 'Python (Numba / Open3D / Laspy)',
    formats: ['LAS', 'LAZ', 'CSV', 'JSON'],
    citation: 'Landscape-CV Contributors (2024). PyTLidar: Python Quantitative Structure Modeling for Terrestrial LiDAR.',
    recipe: `# Run PyTLidar inside isolated uv environment (GPL-3.0 licensed)
uv venv .venv-pytlidar --python 3.11
uv pip install --python .venv-pytlidar numba open3d laspy
.venv-pytlidar/bin/python -m pytlidar --input single_oak.laz --output qsm_metrics.json`,
    bridgePaths: [
      'structural_baseline.dbh_cm',
      'structural_baseline.height_m',
      'structural_baseline.crown_spread_ns_m',
      'structural_baseline.crown_spread_ew_m',
    ],
    sampleOutput: {
      structural_baseline: {
        dbh_cm: 53.7,
        height_m: 16.8,
        crown_spread_ns_m: 12.4,
        crown_spread_ew_m: 11.9,
      },
    },
  },
  rtwig: {
    language: 'R / C++ (Rcpp)',
    formats: ['CSV (TreeQSM / SimpleForest / aRchi Cylinders)', 'RDS'],
    citation: 'Morales, A., & MacFarlane, D. W. (2024). rTwig: Real Twig correction for over-estimated small branch cylinders in Quantitative Structure Models. CRAN.',
    recipe: `# Apply Real Twig allometric tapering correction to raw QSM cylinder table
docker run --rm -v "$PWD:/data" openarbor/renv-qsm:latest Rscript -e "
  library(rTwig); cyl <- read.csv('/data/raw_qsm_cylinders.csv');
  corrected <- run_rtwig(cyl, twig_radius = 4.2);
  write.csv(corrected, '/data/rtwig_corrected.csv', row.names = FALSE)"`,
    bridgePaths: [
      'structural_baseline.dual_valuation.holobiont_200yr_biological_equity_usd',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.canopy_volume_expansion_target_pct',
    ],
    sampleOutput: {
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          sanctuary_scorecard_targets: {
            canopy_volume_expansion_target_pct: 22.0,
          },
        },
      },
    },
  },
  lidr: {
    language: 'R / C++ (Rcpp / sf / terra)',
    formats: ['LAS', 'LAZ', 'COPC', 'GeoTIFF (CHM)', 'GeoPackage'],
    citation: 'Roussel, J.-R., et al. (2020). lidR: An R package for analysis of Airborne Laser Scanning (ALS) data. Remote Sensing of Environment, 251, 112061.',
    recipe: `# Generate 0.5m Canopy Height Model (CHM) and segment individual tree crowns
docker run --rm -v "$PWD:/data" openarbor/renv-lidar:latest Rscript -e "
  library(lidR); las <- readLAS('/data/sanctuary_als.laz');
  chm <- rasterize_canopy(las, res = 0.5, p2r());
  ttops <- locate_trees(las, lmf(ws = 5));
  sf::st_write(ttops, '/data/lidr_treetops.gpkg', delete_dsn = TRUE)"`,
    bridgePaths: [
      'structural_baseline.height_m',
      'structural_baseline.crown_spread_ns_m',
      'structural_baseline.crown_spread_ew_m',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.canopy_projection_area_m2',
    ],
    sampleOutput: {
      structural_baseline: {
        height_m: 22.7,
        crown_spread_ns_m: 16.2,
        crown_spread_ew_m: 15.4,
      },
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          sanctuary_scorecard_targets: {
            canopy_projection_area_m2: 195.94,
          },
        },
      },
    },
  },
  pdal: {
    language: 'C++ / JSON Pipeline CLI',
    formats: ['LAS', 'LAZ', 'COPC', 'E57', 'BPF', 'GeoTIFF'],
    citation: 'PDAL Contributors (2018). PDAL: The Point Data Abstraction Library. https://pdal.io',
    recipe: `# Execute PDAL SMRF ground classification and Height Above Ground (HAG) normalization
conda run -n pdal-env pdal pipeline pdal_hag_normalize.json \
  --readers.las.filename=raw_scan.laz \
  --writers.las.filename=normalized_hag.laz`,
    bridgePaths: [
      'structural_baseline.height_m',
      'rhizosphere_and_root_collar.root_flare_burial_depth_cm',
    ],
    sampleOutput: {
      structural_baseline: {
        height_m: 20.4,
      },
      rhizosphere_and_root_collar: {
        root_flare_burial_depth_cm: 9.5,
      },
    },
  },
  deepforest: {
    language: 'Python (PyTorch / Torchvision / Rasterio)',
    formats: ['GeoTIFF (RGB Orthomosaic)', 'GeoJSON', 'CSV', 'Shapefile'],
    citation: 'Weinstein, B. G., et al. (2020). Cross-site learning in deep learning RGB tree crown detection. Ecological Informatics, 56, 101061.',
    recipe: `# Run CPU-verified DeepForest crown detection on drone orthomosaic tile
uv venv .venv-deepforest --python 3.11
uv pip install --python .venv-deepforest deepforest rasterio geopandas
.venv-deepforest/bin/python -c "
from deepforest import main
m = main.deepforest(); m.load_model(model_name='weecology/deepforest-tree', revision='main')
boxes = m.predict_tile(path='orthomosaic_rgb.tif', patch_size=400, patch_overlap=0.15)
boxes.to_file('predicted_crowns.geojson', driver='GeoJSON')"`,
    bridgePaths: [
      'structural_baseline.crown_spread_ns_m',
      'structural_baseline.crown_spread_ew_m',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.canopy_projection_area_m2',
    ],
    sampleOutput: {
      structural_baseline: {
        crown_spread_ns_m: 13.4,
        crown_spread_ew_m: 12.8,
      },
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          sanctuary_scorecard_targets: {
            canopy_projection_area_m2: 134.71,
          },
        },
      },
    },
  },
  pycrown: {
    language: 'Python / Cython (GDAL / Rasterio / SciPy)',
    formats: ['GeoTIFF (CHM / DSM / DTM)', 'LAS/LAZ', 'Shapefile / GeoJSON'],
    citation: 'Zörner, J., et al. (2018). PyCrown: Fast raster-based individual tree segmentation for LiDAR data. Landcare Research NZ Ltd.',
    recipe: `# Run watershed/Dalponte crown delineation in isolated pinned GDAL environment
uv run --python .venv-pycrown python run_pycrown_delineation.py --chm chm_05m.tif --out crowns_polygons.geojson`,
    bridgePaths: [
      'structural_baseline.height_m',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.canopy_projection_area_m2',
    ],
    sampleOutput: {
      structural_baseline: {
        height_m: 23.1,
      },
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          sanctuary_scorecard_targets: {
            canopy_projection_area_m2: 168.2,
          },
        },
      },
    },
  },
  treeeyed: {
    language: 'Python (QGIS Plugin / ONNX Runtime)',
    formats: ['GeoTIFF', 'GeoPackage', 'Shapefile'],
    citation: 'Ruiz, A. F., et al. (2023). TreeEyed: AI-powered tree crown delineation plugin for QGIS.',
    recipe: `# Launch inside qualified QGIS LTR desktop profile with ONNX Runtime CPU provider
qgis --profile openarbor-treeeyed parcel_ortho.tif`,
    bridgePaths: [
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.canopy_projection_area_m2',
    ],
    sampleOutput: {
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          sanctuary_scorecard_targets: {
            canopy_projection_area_m2: 149.0,
          },
        },
      },
    },
  },
  rgedi: {
    language: 'R (HDF5 / sf / lidR)',
    formats: ['HDF5 (.h5 GEDI L1B/L2A/L2B/L4A)', 'GeoPackage', 'CSV'],
    citation: 'Silva, C. A., et al. (2020). rGEDI: An R Package for NASA Global Ecosystem Dynamics Investigation (GEDI) Data Visualizing and Processing.',
    recipe: `# Extract GEDI L2A relative height metrics and L2B Plant Area Index (PAI) profile
docker run --rm -v "$PWD:/data" openarbor/renv-lidar:latest Rscript -e "
  library(rGEDI); l2a <- readLevel2A('/data/GEDI02_A_sample.h5');
  metrics <- getLevel2AM(l2a); write.csv(metrics, '/data/gedi_rh_metrics.csv', row.names = FALSE)"`,
    bridgePaths: [
      'structural_baseline.height_m',
      'structural_baseline.live_crown_ratio_pct',
    ],
    sampleOutput: {
      structural_baseline: {
        height_m: 26.4,
        live_crown_ratio_pct: 68,
      },
    },
  },
  dplr: {
    language: 'R / C (Dendrochronology Program Library in R)',
    formats: ['Tucson (.rwl)', 'Heidelberg (.fh)', 'Compact', 'CSV'],
    citation: 'Bunn, A. G. (2008). A dendrochronology program library in R (dplR). Dendrochronologia, 26(2), 115-124.',
    recipe: `# Detrend ring-width series and compute Basal Area Increment (BAI) in R
docker run --rm -v "$PWD:/data" openarbor/renv-dendro:latest Rscript -e "
  library(dplR); rwl <- read.rwl('/data/oak_cores.rwl');
  bai <- bai.out(rwl); write.csv(bai, '/data/basal_area_increment.csv')"`,
    bridgePaths: [
      'structural_baseline.codit_wall_response_rating',
      'outcome_monitoring_schedule.one_year_leading_indicators.target_woundwood_callus_closure_mm_yr',
    ],
    sampleOutput: {
      structural_baseline: {
        codit_wall_response_rating:
          'Post-drought basal area increment recovery verified via dplR; mean radial ring width 3.8 mm/yr over last 5 years.',
      },
      outcome_monitoring_schedule: {
        one_year_leading_indicators: {
          target_woundwood_callus_closure_mm_yr: 7.5,
        },
      },
    },
  },
  pydendron: {
    language: 'Python (PyQt6 / Pandas / SciPy)',
    formats: ['JSON', 'RWL (Tucson)', 'CSV', 'Excel'],
    citation: 'Meignier, S., et al. (2024). pyDendron: Interactive Python application for tree-ring cross-dating and chronology management. LIUM, Le Mans Universite.',
    recipe: `# Launch pyDendron cross-dating environment inside dedicated uv virtualenv
uv venv .venv-pydendron --python 3.11
uv pip install --python .venv-pydendron pyqt6 pandas numpy scipy
.venv-pydendron/bin/python -m pydendron`,
    bridgePaths: [
      'structural_baseline.codit_wall_response_rating',
      'structural_baseline.dual_valuation.veteran_keystone_habitat_multiplier',
    ],
    sampleOutput: {
      structural_baseline: {
        codit_wall_response_rating: 'Cross-dated 168-year ring chronology confirmed; release event observed post-1985.',
        dual_valuation: {
          veteran_keystone_habitat_multiplier: 2.6,
        },
      },
    },
  },
  tras: {
    language: 'Python (OpenCV / PyQt5 / NumPy)',
    formats: ['TIFF / PNG (High-Res Core Scan)', 'RWL', 'CSV', 'JSON'],
    citation: 'Marichal, H., et al. (2024). TRAS: Tree Ring Analyzer Suite with Deep Learning Pith and Ring Boundary Detection (CS-TRD / DeepDendro).',
    recipe: `# Measure radial increment widths from flatbed core scan image
uv run --python .venv-tras python -m tras.cli --image core_scan_1200dpi.tif --output core_rings.rwl`,
    bridgePaths: [
      'outcome_monitoring_schedule.one_year_leading_indicators.target_woundwood_callus_closure_mm_yr',
      'outcome_monitoring_schedule.one_year_leading_indicators.target_annual_twig_extension_min_cm',
    ],
    sampleOutput: {
      outcome_monitoring_schedule: {
        one_year_leading_indicators: {
          target_annual_twig_extension_min_cm: 12.0,
          target_woundwood_callus_closure_mm_yr: 8.0,
        },
      },
    },
  },
  treeclim: {
    language: 'R / C++ (Rcpp / dplR)',
    formats: ['RWL', 'CSV (Monthly PRISM / NOAA Climate Series)', 'RDS'],
    citation: 'Zang, C., & Biondi, F. (2015). treeclim: an R package for the numerical calibration of proxy-climate relationships. Ecography, 38(4), 431-436.',
    recipe: `# Calibrate ring-width chronology against monthly precipitation and VPD
docker run --rm -v "$PWD:/data" openarbor/renv-dendro:latest Rscript -e "
  library(treeclim); library(dplR);
  chrono <- read.crn('/data/quercus_crn.crn'); clim <- read.csv('/data/prism_monthly.csv');
  resp <- dcc(chrono, clim, selection = -6:9, method = 'response');
  write.csv(resp\\$coef, '/data/climate_sensitivity.csv')"`,
    bridgePaths: [
      'outcome_monitoring_schedule.stim_hypothesis_statement',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.stormwater_interception_target_liters_yr',
    ],
    sampleOutput: {
      outcome_monitoring_schedule: {
        stim_hypothesis_statement:
          'treeclim bootstrapped response identifies May-July soil moisture deficit as the primary radial growth bottleneck; TIZ woodchip mulch and swale catchment directly buffer summer drought stress.',
      },
    },
  },
  biomass: {
    language: 'R (AMAP / CIRAD Allometric Engine)',
    formats: ['CSV', 'GeoJSON', 'RDS'],
    citation: 'Rejou-Mechain, M., et al. (2017). BIOMASS: an R package for estimating above-ground biomass and its uncertainty in tropical forests. Methods in Ecology and Evolution, 8(9), 1163-1167.',
    recipe: `# Compute above-ground biomass (AGB) with Monte Carlo wood density uncertainty propagation
docker run --rm -v "$PWD:/data" openarbor/renv-dendro:latest Rscript -e "
  library(BIOMASS); inv <- read.csv('/data/stand_inventory.csv');
  wd <- getWoodDensity(genus = inv\\$genus, species = inv\\$species);
  agb <- computeAGB(D = inv\\$dbh_cm, WD = wd\\$meanWD, H = inv\\$height_m);
  write.csv(data.frame(id = inv\\$id, agb_Mg = agb), '/data/biomass_out.csv', row.names = FALSE)"`,
    bridgePaths: [
      'structural_baseline.dual_valuation.holobiont_200yr_biological_equity_usd',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.canopy_volume_expansion_target_pct',
    ],
    sampleOutput: {
      structural_baseline: {
        dual_valuation: {
          ctla_10th_ed_depreciated_usd: 11200,
          holobiont_200yr_biological_equity_usd: 34900,
          veteran_keystone_habitat_multiplier: 2.1,
        },
      },
    },
  },
  allodb: {
    language: 'R (Smithsonian ForestGEO)',
    formats: ['CSV', 'RDS', 'JSON'],
    citation: 'Gonzalez-Akre, E., et al. (2022). allodb: An R package for biomass estimation at globally distributed extratropical forest plots. Methods in Ecology and Evolution, 13(2), 330-338.',
    recipe: `# Run extratropical species-calibrated biomass equations from Smithsonian ForestGEO allodb
docker run --rm -v "$PWD:/data" openarbor/renv-dendro:latest Rscript -e "
  library(allodb); trees <- read.csv('/data/temperate_trees.csv');
  trees\\$agb_kg <- get_biomass(dbh = trees\\$dbh_cm, genus = trees\\$genus, species = trees\\$species, coords = c(-122.71, 42.19));
  write.csv(trees, '/data/allodb_biomass.csv', row.names = FALSE)"`,
    bridgePaths: [
      'structural_baseline.dual_valuation.holobiont_200yr_biological_equity_usd',
      'structural_baseline.dbh_cm',
    ],
    sampleOutput: {
      structural_baseline: {
        dbh_cm: 62.5,
        dual_valuation: {
          ctla_10th_ed_depreciated_usd: 12400,
          holobiont_200yr_biological_equity_usd: 38750,
          veteran_keystone_habitat_multiplier: 2.2,
        },
      },
    },
  },
  fvs: {
    language: 'Fortran / C / SQLite (USDA Forest Service)',
    formats: ['FVS Keyword (.key)', 'SQLite (.db)', 'CSV'],
    citation: 'Dixon, G. E. (2002, rev. 2024). Essential FVS: A user guide to the Forest Vegetation Simulator. Internal Rep. Fort Collins, CO: U.S. Department of Agriculture, Forest Service, Forest Management Service Center.',
    recipe: `# Run Pacific Northwest (FVS-PN) or Southern (FVS-SN) variant inside container sidecar
docker run --rm -v "$PWD:/work" openarbor/open-fvs:latest FVSie --keywordfile=/work/sanctuary_stand.key`,
    bridgePaths: [
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.canopy_volume_expansion_target_pct',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.restoration_potential_realized_pct',
    ],
    sampleOutput: {
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          sanctuary_scorecard_targets: {
            canopy_volume_expansion_target_pct: 19.4,
            restoration_potential_realized_pct: 82.0,
          },
        },
      },
    },
  },
  microfvs: {
    language: 'Python / FastAPI / Docker (Vibrant Planet)',
    formats: ['JSON', 'Parquet', 'SQLite'],
    citation: 'Vibrant Planet Open Science (2024). microfvs: Cloud-native and local container REST wrapper for USDA Forest Vegetation Simulator.',
    recipe: `# Launch local microfvs container service for batch 5-year stand growth projections
docker run --rm -p 8005:8000 ghcr.io/vibrant-planet-open-science/microfvs:latest`,
    bridgePaths: [
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.canopy_volume_expansion_target_pct',
    ],
    sampleOutput: {
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          sanctuary_scorecard_targets: {
            canopy_volume_expansion_target_pct: 21.0,
          },
        },
      },
    },
  },
  capsis: {
    language: 'Java (INRAE / CIRAD Multi-Model Platform)',
    formats: ['Capsis Inventory (.inv)', 'CSV', 'XML'],
    citation: 'Dufour-Kowalski, S., et al. (2012). Capsis: an open software framework and community for forest growth modelling. Annals of Forest Science, 69(2), 221-233.',
    recipe: `# Execute Capsis in script mode for uneven-aged mixed stand agroforestry simulation
sh capsis.sh -p script HetereScenario stand_input.inv 5`,
    bridgePaths: [
      'understory_and_guild_prescription.reference_ecosystem_name',
      'outcome_monitoring_schedule.five_year_lagging_indicators.target_ser_recovery_wheel_stars',
    ],
    sampleOutput: {
      understory_and_guild_prescription: {
        reference_ecosystem_name: 'Rogue Valley Oregon White Oak Savanna',
      },
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          target_ser_recovery_wheel_stars: 4.2,
        },
      },
    },
  },
  'sortie-nd': {
    language: 'C++ / Java (Spatially Explicit Neighborhood Model)',
    formats: ['XML Parameter File', 'Tab-Delimited Output (.out)', 'GZ Tarball'],
    citation: 'Canham, C. D., Murphy, L., & Papaik, M. J. (2005). SORTIE-ND: Spatially Explicit Simulation of Forest Dynamics. Cary Institute of Ecosystem Studies.',
    recipe: `# Run headless C++ SORTIE-ND core engine on neighborhood light competition XML
./coremodel sanctuary_understory_light_competition.xml`,
    bridgePaths: [
      'understory_and_guild_prescription.native_companion_species_guild',
      'outcome_monitoring_schedule.one_year_leading_indicators.companion_guild_survival_min_pct',
    ],
    sampleOutput: {
      outcome_monitoring_schedule: {
        one_year_leading_indicators: {
          companion_guild_survival_min_pct: 85,
        },
      },
    },
  },
  'landis-ii': {
    language: 'C# / .NET Core 8.0',
    formats: ['TXT Scenario Files', 'GeoTIFF', 'CSV'],
    citation: 'Scheller, R. M., et al. (2007). Design, development, and application of LANDIS-II, a spatial landscape simulation model with flexible temporal and spatial resolutions. Ecological Modelling, 201(3-4), 409-419.',
    recipe: `# Run LANDIS-II succession and disturbance scenario via .NET 8 CLI
dotnet landis-ii-console scenario_necnsuccession.txt`,
    bridgePaths: [
      'soil_and_microbiome_baseline.organic_matter_pct',
      'outcome_monitoring_schedule.five_year_lagging_indicators.target_organic_matter_min_pct',
    ],
    sampleOutput: {
      soil_and_microbiome_baseline: {
        organic_matter_pct: 3.4,
      },
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          target_organic_matter_min_pct: 5.2,
        },
      },
    },
  },
  cell2fire: {
    language: 'C++ (OpenMP) / Python',
    formats: ['ASCII Grid (.asc)', 'GeoTIFF', 'CSV (Weather & Fuel Grids)'],
    citation: 'Pais, C., et al. (2021). Cell2Fire: A Cell-Based Forest Fire Growth Model to Support Strategic Landscape Management Planning. Frontiers in Forests and Global Change, 4, 692706.',
    recipe: `# Simulate crown and surface fire spread reduction after understory fuel ladder pruning
./Cell2Fire --input-instance-folder ./fuel_grid_sanctuary/ --output-folder ./fire_results/ --sim-years 1 --nsims 50`,
    bridgePaths: [
      'structural_baseline.municipal_permit_disposition.recommended_disposition',
      'structural_baseline.isa_traq_risk.overall_risk_rating',
      'structural_baseline.isa_traq_risk.residual_risk_rating',
    ],
    sampleOutput: {
      structural_baseline: {
        isa_traq_risk: {
          overall_risk_rating: 'Moderate',
          residual_risk_rating: 'Low',
        },
        municipal_permit_disposition: {
          recommended_disposition: 'Structural_Risk_Reduction_Pruning',
        },
      },
    },
  },
  fmt: {
    language: 'C++ / Python / R (COIN-OR CLP Linear Programming)',
    formats: ['Woodstock (.pri, .are, .yld, .act)', 'CSV', 'JSON'],
    citation: 'Bureau du Forestier en chef du Quebec (2022). FMT (Forest Management Tool): Open-source spatial forest planning library.',
    recipe: `# Solve multi-objective ecological retention schedule using FMT and COIN-OR CLP
python3 -c "import FMT; parser = FMT.Parser.FMTmodelparser(); model = parser.readproject('sanctuary.pri', ['sanctuary.seq'])"`,
    bridgePaths: [
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.restoration_potential_realized_pct',
    ],
    sampleOutput: {
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          sanctuary_scorecard_targets: {
            restoration_potential_baseline_pct: 52,
            restoration_potential_realized_pct: 86,
          },
        },
      },
    },
  },
  hemispher: {
    language: 'R (terra / Digital Hemispherical Photography)',
    formats: ['JPEG / TIFF (Fisheye Hemispherical Photo)', 'CSV'],
    citation: 'Chianucci, F., & Macek, M. (2023). hemispheR: an R package for fisheye canopy image analysis. Agricultural and Forest Meteorology, 336, 109470.',
    recipe: `# Compute canopy gap fraction and effective Leaf Area Index (LAI) from upward fisheye photo
docker run --rm -v "$PWD:/data" openarbor/renv-canopy:latest Rscript -e "
  library(hemispheR); img <- import_fisheye('/data/canopy_azimuth180.jpg', circular = TRUE);
  bw <- binarize_fisheye(img); gf <- gapfrac_fisheye(bw, lens = 'equidistant');
  lai <- canopy_fisheye(gf); write.csv(lai, '/data/hemispher_lai.csv', row.names = FALSE)"`,
    bridgePaths: [
      'structural_baseline.live_crown_ratio_pct',
      'outcome_monitoring_schedule.one_year_leading_indicators.target_canopy_dieback_max_pct',
      'outcome_monitoring_schedule.one_year_leading_indicators.fixed_photopoint_azimuth_deg',
    ],
    sampleOutput: {
      structural_baseline: {
        live_crown_ratio_pct: 71,
      },
      outcome_monitoring_schedule: {
        one_year_leading_indicators: {
          target_canopy_dieback_max_pct: 5,
          fixed_photopoint_azimuth_deg: 180,
        },
      },
    },
  },
  gaplightr: {
    language: 'R (terra / lidR / sf)',
    formats: ['JPEG / TIFF', 'LAS / LAZ (Synthetic Hemispherical Views)', 'CSV'],
    citation: 'Hakai Institute Contributors (2024). gaplightr: Gap Light Analyzer workflows in R for physical and LiDAR-synthesized hemispherical views.',
    recipe: `# Calculate Direct and Diffuse Site Factors (% Transmitted PAR) for understory guild placement
docker run --rm -v "$PWD:/data" openarbor/renv-canopy:latest Rscript -e "
  library(gaplightr); res <- analyze_hemiphoto('/data/understory_north.tif', lat = 30.2672);
  write.csv(res, '/data/understory_light_par.csv', row.names = FALSE)"`,
    bridgePaths: [
      'understory_and_guild_prescription.native_companion_species_guild',
      'outcome_monitoring_schedule.one_year_leading_indicators.companion_guild_survival_min_pct',
    ],
    sampleOutput: {
      understory_and_guild_prescription: {
        native_companion_species_guild: [
          {
            scientific_name: 'Chasmanthium latifolium',
            common_name: 'Inland Sea Oats',
            inaturalist_taxon_id: 129047,
            open_nursery_batch_id: 'ON-EDW-2026-019',
            stratum_layer: 'Herbaceous_Perennial',
            functional_role: 'Hydrologic_Swale_Or_Infiltration_Anchor',
            quantity_planted: 24,
          },
        ],
      },
    },
  },
  'birdnet-analyzer': {
    language: 'Python (TFLite / Librosa / NumPy)',
    formats: ['WAV / FLAC / MP3', 'Raven Selection Table (.txt)', 'CSV', 'JSON'],
    citation: 'Kahl, S., Wood, C. M., Eibl, M., & Klinck, H. (2021). BirdNET: A deep learning solution for avian diversity monitoring. Ecological Informatics, 61, 101236.',
    recipe: `# Note: Code is MIT; model weights carry CC BY-NC-SA 4.0 terms (explicit operator opt-in required)
uv run --python .venv-birdnet python -m birdnet_analyzer.analyze /data/tiz_dawn_chorus.wav \
  --o /data/birdnet_detections/ --lat 30.2672 --lon -97.7431 --min_conf 0.75 --rtype csv`,
    bridgePaths: [
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.documented_native_biodiversity_taxa_baseline',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.documented_native_biodiversity_taxa_min',
    ],
    sampleOutput: {
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          sanctuary_scorecard_targets: {
            documented_native_biodiversity_taxa_baseline: 14,
            documented_native_biodiversity_taxa_min: 28,
          },
        },
      },
    },
  },
  'scikit-maad': {
    language: 'Python (SciPy / Scikit-Learn / Librosa)',
    formats: ['WAV', 'CSV', 'JSON'],
    citation: 'Ulloa, J. S., et al. (2021). scikit-maad: An open-source and modular toolbox for quantitative soundscape analysis in Python. Methods in Ecology and Evolution, 12(12), 2334-2340.',
    recipe: `# Compute Acoustic Complexity Index (ACI) and Acoustic Diversity Index (ADI) across TIZ recordings
uv venv .venv-maad --python 3.11
uv pip install --python .venv-maad scikit-maad
.venv-maad/bin/python -c "
from maad import sound, features
s, fs = sound.load('tiz_dawn_chorus.wav')
Sxx, tn, fn, ext = sound.spectrogram(s, fs)
aci_xx, aci_per_bin, aci_sum = features.acoustic_complexity_index(Sxx)
print({'ACI_total': round(float(aci_sum), 2)})"`,
    bridgePaths: [
      'outcome_monitoring_schedule.five_year_lagging_indicators.target_ser_recovery_wheel_stars',
      'outcome_monitoring_schedule.five_year_lagging_indicators.sanctuary_scorecard_targets.documented_native_biodiversity_taxa_min',
    ],
    sampleOutput: {
      outcome_monitoring_schedule: {
        five_year_lagging_indicators: {
          target_ser_recovery_wheel_stars: 4.5,
          sanctuary_scorecard_targets: {
            documented_native_biodiversity_taxa_baseline: 14,
            documented_native_biodiversity_taxa_min: 30,
          },
        },
      },
    },
  },
};

/**
 * Normalize raw catalog tier strings to the 4 canonical Packaging Tier filter options.
 * @param {string} rawTier
 * @returns {string}
 */
function normalizePackagingTier(rawTier) {
  if (!rawTier) return 'Tier 1: Python/R CLI (uv/conda)';
  if (rawTier === 'Core Browser/Node ESM') return 'Core Browser/Node ESM';
  if (rawTier.includes('Tier 3')) return 'Tier 3: Container / Sidecar';
  if (rawTier.startsWith('Tier 2')) return 'Tier 2: Native Desktop GUI';
  return 'Tier 1: Python/R CLI (uv/conda)';
}

/**
 * Map catalog readiness and tool id to honest Doc-414 Evidence Grade filter options:
 * ('Workflow-qualified', 'Smoke-tested', 'Installed', 'Recipe available', 'Cataloged')
 * @param {object} rawEntry
 * @returns {string}
 */
function resolveEvidenceGrade(rawEntry) {
  if (rawEntry.isCoreEsm) return 'Workflow-qualified';
  const id = rawEntry.id;
  const readiness = rawEntry.readiness || '';
  if (['qgis', 'gdal', 'cloudcompare', 'forest-search', '3dfin', 'deepforest', 'birdnet-analyzer', 'scikit-maad'].includes(id)) {
    return 'Workflow-qualified';
  }
  if (['qfield', 'treeseg', 'pytlidar', 'pydendron', 'landis-ii', 'cell2fire', 'fmt'].includes(id)) {
    return 'Smoke-tested';
  }
  if (['canopywatch', 'lidr', 'dplr', 'hemispher'].includes(id)) {
    return 'Installed';
  }
  if (readiness === 'container-ready') {
    return 'Recipe available';
  }
  return 'Cataloged';
}

/**
 * Build the unified 41-entry workbench list from:
 * - 4 Open Arbor Core ESM Engines
 * - 33 Forestry Tools (forestryToolsCatalog.tools)
 * - 4 Supporting Apps (forestryToolsCatalog.supporting_applications)
 */
export function buildUnifiedWorkbenchCatalog() {
  const coreEntries = CORE_ESM_TOOLS.map((item) => ({
    ...item,
    rawTier: item.packagingTier,
  }));

  const rawTools = Array.isArray(forestryToolsCatalog.tools) ? forestryToolsCatalog.tools : [];
  const rawSupporting = Array.isArray(forestryToolsCatalog.supporting_applications)
    ? forestryToolsCatalog.supporting_applications
    : [];

  const mapCatalogEntry = (entry, isSupporting = false) => {
    const meta = TOOL_BRIDGE_METADATA[entry.id] || {};
    const groupKey = isSupporting ? 'supporting' : entry.group;
    const packagingTier = normalizePackagingTier(entry.tier);
    const evidenceGrade = resolveEvidenceGrade(entry);
    const deps = Array.isArray(entry.dependencies)
      ? entry.dependencies
      : [entry.ubuntu_package, ...(entry.ubuntu_additional_packages || [])].filter(Boolean);

    return {
      id: entry.id,
      name: entry.name,
      group: groupKey,
      domain: entry.domain,
      upstream_url: entry.upstream_url,
      license: entry.license,
      language: meta.language || (deps.includes('r-base') ? 'R' : deps.includes('python3') ? 'Python' : 'Native / CLI'),
      rawTier: entry.tier,
      packagingTier,
      evidenceGrade,
      installMethod: entry.install_method || 'native',
      isCoreEsm: false,
      formats: meta.formats || ['CSV', 'JSON', 'GeoJSON'],
      tags: [entry.id, groupKey, entry.install_method, ...deps].filter(Boolean),
      summary: `${entry.domain}. ${entry.constraints || ''}`.trim(),
      citation: meta.citation || `${entry.name} upstream documentation (${entry.upstream_url}).`,
      recipe:
        meta.recipe ||
        `# Local sovereign execution recipe (${entry.install_method})\n# Upstream: ${entry.upstream_url}`,
      bridgeTargetPaths: meta.bridgePaths || ['structural_baseline.dbh_cm'],
      bridgeSnippet: meta.sampleOutput || {
        schema_version: 'RCA_v2',
        assessment_mode: 'Regenerative Diagnostic',
      },
    };
  };

  const toolEntries = rawTools.map((t) => mapCatalogEntry(t, false));
  const supportingEntries = rawSupporting.map((s) => mapCatalogEntry(s, true));

  return [...coreEntries, ...toolEntries, ...supportingEntries];
}

/**
 * Return badge class for evidence grade
 * @param {string} grade
 */
function getGradeBadgeClass(grade) {
  switch (grade) {
    case 'Workflow-qualified':
      return 'badge badge-protected';
    case 'Smoke-tested':
      return 'badge badge-heritage';
    case 'Installed':
      return 'badge badge-neutral';
    case 'Recipe available':
      return 'badge badge-warn';
    default:
      return 'badge badge-neutral';
  }
}

/**
 * Escape HTML special characters safely
 * @param {string} str
 */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Initialize the 41-Tool Forestry Workbench UI
 */
export function initToolsCatalogUI() {
  const root = document.getElementById('tools-catalog-root');
  if (!root) return;

  const allEntries = buildUnifiedWorkbenchCatalog();
  const groupDescriptions = {
    all: 'All 4 Open Arbor Core ESM engines, 33 scientific forestry models, and 4 supporting geospatial applications.',
    'core-esm':
      'Zero-dependency ECMAScript Modules running natively in the browser and Node.js for root zones, municipal ordinances, ecosystem benefits, and RCA-Spec v2.0 diagnostics.',
    ...(forestryToolsCatalog.groups || {}),
  };

  const searchInput = document.getElementById('tool-search-input');
  const tierSelect = document.getElementById('tool-tier-select');
  const gradeSelect = document.getElementById('tool-grade-select');
  const domainTabsContainer = document.getElementById('tool-domain-tabs');
  const statusEl = document.getElementById('tools-filter-status');
  const domainDescEl = document.getElementById('tools-domain-description');
  const resetBtn = document.getElementById('tools-reset-filters');
  const gridContainer = document.getElementById('tools-grid-container');
  const dialog = document.getElementById('tool-detail-dialog');
  const dialogTitle = document.getElementById('tool-dialog-title');
  const dialogBadge = document.getElementById('tool-dialog-badge');
  const dialogBody = document.getElementById('tool-dialog-body');

  // Mandatory modern-web-guidance (light-dismiss-a-dialog) fallback for browsers without closedBy support
  if (dialog && !('closedBy' in HTMLDialogElement.prototype)) {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (isDialogContent) return;
      dialog.close();
    });
  }

  let activeDomain = 'all';

  function openToolDialog(tool) {
    if (!dialog || !dialogTitle || !dialogBody) return;
    dialogTitle.textContent = `${tool.name} (${tool.domain})`;
    if (dialogBadge) {
      dialogBadge.textContent = tool.evidenceGrade;
    }

    const snippetJson = JSON.stringify(tool.bridgeSnippet, null, 2);
    const pathsHtml = tool.bridgeTargetPaths
      .map((p) => `<li><code>${escapeHtml(p)}</code></li>`)
      .join('');

    dialogBody.innerHTML = `
      <div class="muni-lookup-box">
        <div class="muni-header">
          <strong>Upstream Repository &amp; Provenance</strong>
          <a href="${escapeHtml(tool.upstream_url)}" target="_blank" rel="noopener noreferrer" class="muni-link">
            ${escapeHtml(tool.upstream_url)}
          </a>
        </div>
        <p class="muni-citation">
          <strong>Literature &amp; Standard Citation:</strong> ${escapeHtml(tool.citation)}
        </p>
        <div class="metric-grid metric-grid-4">
          <div class="metric-box">
            <span class="metric-label">Packaging Tier</span>
            <strong class="metric-value">${escapeHtml(tool.packagingTier)}</strong>
            <span class="metric-sub">${escapeHtml(tool.rawTier)}</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">Runtime &amp; License</span>
            <strong class="metric-value">${escapeHtml(tool.language)}</strong>
            <span class="metric-sub">License: ${escapeHtml(tool.license)}</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">Evidence Grade</span>
            <strong class="metric-value text-accent">${escapeHtml(tool.evidenceGrade)}</strong>
            <span class="metric-sub">Doc-414 Governance</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">Supported I/O Formats</span>
            <strong class="metric-value">${escapeHtml(tool.formats.join(', '))}</strong>
            <span class="metric-sub">Sovereign local files</span>
          </div>
        </div>
      </div>

      <div>
        <div class="svg-map-header">
          <strong>1. Local Sovereign Execution Recipe</strong>
          <button type="button" class="btn-secondary tab-btn" data-copy-target="dialog-recipe-code">
            Copy CLI Recipe
          </button>
        </div>
        <pre id="dialog-recipe-code" class="code-preview">${escapeHtml(tool.recipe)}</pre>
      </div>

      <div>
        <h3 class="sub-heading">2. Open Arbor <code>RCA_v2</code> Schema Pipeline Bridge</h3>
        <p class="subtitle">
          Outputs from <strong>${escapeHtml(tool.name)}</strong> map deterministically into the following JSON paths inside <code>schemas/rca_assessment.schema.json</code>:
        </p>
        <ul class="muni-subtext">${pathsHtml}</ul>
      </div>

      <div>
        <div class="svg-map-header">
          <strong>3. Sample <code>RCA_v2</code> Bridge Payload Snippet</strong>
          <button type="button" class="btn-secondary tab-btn" data-copy-target="dialog-bridge-code">
            Copy RCA_v2 JSON Snippet
          </button>
        </div>
        <pre id="dialog-bridge-code" class="code-preview">${escapeHtml(snippetJson)}</pre>
      </div>
    `;

    dialogBody.querySelectorAll('[data-copy-target]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const targetId = btn.getAttribute('data-copy-target');
        const codeEl = targetId ? document.getElementById(targetId) : null;
        if (!codeEl) return;
        const originalLabel = btn.textContent;
        try {
          await navigator.clipboard.writeText(codeEl.textContent || '');
          btn.textContent = 'Copied to Clipboard';
        } catch {
          btn.textContent = 'Copy Ready';
        }
        setTimeout(() => {
          btn.textContent = originalLabel;
        }, 1800);
      });
    });

    dialog.showModal();
  }

  function renderCards() {
    if (!gridContainer) return;
    const query = (searchInput?.value || '').trim().toLowerCase();
    const selectedTier = tierSelect?.value || 'all';
    const selectedGrade = gradeSelect?.value || 'all';

    const filtered = allEntries.filter((entry) => {
      if (activeDomain !== 'all' && entry.group !== activeDomain) {
        return false;
      }
      if (selectedTier !== 'all' && entry.packagingTier !== selectedTier) {
        return false;
      }
      if (selectedGrade !== 'all' && entry.evidenceGrade !== selectedGrade) {
        return false;
      }
      if (query.length > 0) {
        const haystack = [
          entry.name,
          entry.id,
          entry.domain,
          entry.group,
          entry.language,
          entry.license,
          entry.summary,
          entry.formats.join(' '),
          entry.tags.join(' '),
          entry.bridgeTargetPaths.join(' '),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });

    if (statusEl) {
      statusEl.textContent = `Showing ${filtered.length} of ${allEntries.length} workbench entries`;
    }
    if (domainDescEl) {
      domainDescEl.textContent = groupDescriptions[activeDomain] || groupDescriptions.all;
    }

    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <div class="card">
          <p class="subtitle">No tools matched the current filter combination. Click <strong>Reset Filters</strong> to restore all 41 workbench entries.</p>
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = filtered
      .map((tool) => {
        const gradeBadgeClass = getGradeBadgeClass(tool.evidenceGrade);
        const coreActionHtml = tool.isCoreEsm
          ? `<a href="../demo/index.html" class="btn btn-primary">Launch in Live Engine Demo</a>`
          : '';

        return `
          <article class="card" data-tool-id="${escapeHtml(tool.id)}">
            <div class="muni-header">
              <div>
                <span class="eyebrow">${escapeHtml(tool.group)} &middot; ${escapeHtml(tool.domain)}</span>
                <h2>${escapeHtml(tool.name)}</h2>
              </div>
              <div class="header-actions">
                <span class="${gradeBadgeClass}">${escapeHtml(tool.evidenceGrade)}</span>
                <span class="badge badge-neutral">${escapeHtml(tool.packagingTier)}</span>
                <span class="badge badge-neutral">${escapeHtml(tool.language)} &middot; ${escapeHtml(tool.license)}</span>
              </div>
            </div>

            <p class="muni-citation">${escapeHtml(tool.summary)}</p>

            <div class="metric-grid">
              <div class="metric-box">
                <span class="metric-label">Supported File Formats &amp; I/O</span>
                <strong class="metric-value">${escapeHtml(tool.formats.join(', '))}</strong>
              </div>
              <div class="metric-box">
                <span class="metric-label">Primary <code>RCA_v2</code> Schema Target</span>
                <strong class="metric-value text-accent"><code>${escapeHtml(tool.bridgeTargetPaths[0] || 'structural_baseline')}</code></strong>
              </div>
            </div>

            <div class="header-actions">
              ${coreActionHtml}
              <button
                type="button"
                class="btn ${tool.isCoreEsm ? 'btn-outline' : 'btn-secondary'}"
                data-inspect-tool="${escapeHtml(tool.id)}"
              >
                Inspect CLI Recipe, Sample I/O &amp; RCA_v2 Pipeline Bridge
              </button>
            </div>
          </article>
        `;
      })
      .join('');

    gridContainer.querySelectorAll('[data-inspect-tool]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const toolId = btn.getAttribute('data-inspect-tool');
        const found = allEntries.find((item) => item.id === toolId);
        if (found) openToolDialog(found);
      });
    });
  }

  searchInput?.addEventListener('input', renderCards);
  tierSelect?.addEventListener('change', renderCards);
  gradeSelect?.addEventListener('change', renderCards);

  domainTabsContainer?.querySelectorAll('[data-domain]').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      activeDomain = tabBtn.getAttribute('data-domain') || 'all';
      domainTabsContainer.querySelectorAll('[data-domain]').forEach((b) => {
        const isActive = b === tabBtn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      renderCards();
    });
  });

  resetBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (tierSelect) tierSelect.value = 'all';
    if (gradeSelect) gradeSelect.value = 'all';
    activeDomain = 'all';
    domainTabsContainer?.querySelectorAll('[data-domain]').forEach((b) => {
      const isAll = b.getAttribute('data-domain') === 'all';
      b.classList.toggle('active', isAll);
      b.setAttribute('aria-selected', isAll ? 'true' : 'false');
    });
    renderCards();
  });

  renderCards();
}

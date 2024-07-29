document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("form1").addEventListener("submit", (e) => {
    debugger;
    e.preventDefault();
  });

  // Load the Map and MapView modules
  require(["esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer"], (
    Map,
    MapView,
    FeatureLayer,
  ) => {
    const featureLayer = new FeatureLayer({
      url: "https://services.gis.ca.gov/arcgis/rest/services/Boundaries/CA_Counties/FeatureServer/0",
      popupTemplate: {
        title: "CA counties",
        content:
          "OBJECTID: {OBJECTID} <br> Population: {Population}<br>AREA_ID: {AREA_ID}<br>DETAIL_CITY: {DETAIL_CTY}",
      },
    });

    const featureLayer2 = new FeatureLayer({
      url: "https://services.gis.ca.gov/arcgis/rest/services/Boundaries/CA_National_Parks/MapServer/0",
    });

    // Create a Map instance
    const myMap = new Map({
      //   basemap: "topo-vector",
      basemap: "streets-navigation-vector",
    });

    myMap.addMany([featureLayer, featureLayer2]);

    // Create a MapView instance (for 2D viewing) and reference the map instance
    const view = new MapView({
      map: myMap,
      container: "viewDiv",
      center: [-100, 40],
      zoom: 4,
    });

    view.whenLayerView(featureLayer).then((layerView) => {
      const fields = layerView.layer.fields;
      fields.forEach((field) => {
        const option = document.createElement("option");
        option.value = field.name;
        option.textContent = field.name;
        option.dataset.esriType = field.type;

        document.getElementById("fieldSelect").append(option);
      });

      document.getElementById("form1").addEventListener("submit", (e) => {
        const inputValue = document.getElementById("filterInput").value;

        const selectedIndex =
          document.getElementById("fieldSelect").selectedIndex;
        const selectedFieldName = fields[selectedIndex - 1].name;
        const selectedFieldType = fields[selectedIndex - 1].type;

        if (inputValue === "") {
          featureLayer.definitionExpression = "1=1";
          return;
        }
        debugger;
        if (["oid", "integer", "double"].includes(selectedFieldType)) {
          featureLayer.definitionExpression =
            selectedFieldName + " = " + inputValue;
        } else if (selectedFieldType === "string") {
          featureLayer.definitionExpression =
            "LOWER(" +
            selectedFieldName +
            ")" +
            " like " +
            "'" +
            inputValue.toLowerCase() +
            "%'";
        }
      });

      document.getElementById("fieldSelect").addEventListener("change", (e) => {
        document.getElementById("filterInput").value = "";
      });

      let selectedFieldName = "";
      document.getElementById("filterInput").addEventListener("input", (e) => {
        debugger;
        const dataList = document.getElementById("myDataList");
        if (e.currentTarget.value.length < 3) {
          dataList.replaceChildren();
          return;
        }

        const selectedIndex =
          document.getElementById("fieldSelect").selectedIndex;

        selectedFieldName = fields[selectedIndex - 1].name;
        let query = featureLayer.createQuery();
        query.outFields = ["*"];
        query.where = "1=1";
        query.returnDistinct = true;

        featureLayer.queryFeatures(query).then((response) => {
          const features = response.features;
          const attributes = features.map((feature) => feature.attributes);

          const dataListValues = attributes.map(
            (attribute) => attribute[selectedFieldName],
          );

          dataList.replaceChildren();

          dataListValues.forEach((value) => {
            const option = document.createElement("option");
            option.value = value;
            dataList.append(option);
          });
        });
      });
    });

    // setTimeout(() => {
    // //   view.zoom = 10;
    // //   view.center = [-100, 70];
    // }, 5000);
  });
});
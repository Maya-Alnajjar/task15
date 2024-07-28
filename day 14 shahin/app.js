document.addEventListener("DOMContentLoaded", () => {
  // Load the Map and MapView modules
  require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/Graphic",
    "esri/symbols/SimpleFillSymbol",
  ], (Map, MapView, FeatureLayer, Graphic, SimpleFillSymbol) => {
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
      console.log(layerView.layer.fields.map((field) => field.name));
    });

    const fields = ["AREA_ID", "POLYGON_NM", "Population"];
    let query = featureLayer.createQuery();
    // if (userInput.length < 3)
    //     return;
    // query.where = "POLYGON_NM like '" + userInput + "%'";
    query.where = "POLYGON_NM like 'S%'";
    query.outfields = ["*"];
    query.returnGeometry = true;

    featureLayer.queryFeatures(query).then((response) => {
      debugger;
      const features = response.features;
      const attributes = features.map((feature) => feature.attributes);
      const geometries = features.map((feature) => feature.geometry);
      const featuresTable = document.getElementById("features-table");
      const featuresTableHeader = featuresTable.querySelector("thead");
      const featuresTableBody = featuresTable.querySelector("tbody");

      const headerTr = document.createElement("tr");
      featuresTableHeader.append(headerTr);
      debugger;

      fields.forEach((field) => {
        const th = document.createElement("th");
        th.textContent = field;
        headerTr.append(th);
      });

      attributes.forEach((attribute, index) => {
        const tr = document.createElement("tr");
        tr.id = index;
        fields.forEach((field) => {
          const td = document.createElement("td");
          td.textContent = attribute[field];
          tr.append(td);
        });
        featuresTableBody.append(tr);
        tr.addEventListener("click", (e) => {
          view.graphics.removeAll();
          const index = e.currentTarget.id;
          const geometry = geometries[index];
          console.log(geometry);

          const symbol = new SimpleFillSymbol({
            color: [51, 51, 204, 0.9],
            style: "solid",
            outline: {
              color: "white",
              width: 1,
            },
          });
          const graphic = new Graphic({
            geometry,
            symbol,
          });
          view.graphics.add(graphic);
          view.goTo(geometry);
        });
      });
    });

    let query2 = featureLayer2.createQuery();
    query2.groupByFieldsForStatistics = ["UNIT_TYPE"];
    query2.outStatistics = [
      {
        statisticType: "count",
        onStatisticField: "UNIT_TYPE",
        outStatisticFieldName: "TOTALCOUNT",
      },
    ];
    query2.outfields = ["UNIT_TYPE", "TOTALCOUNT"];
    // query2.orderByFields = ["TOTALCOUNT desc"];
    query2.where = "UNIT_TYPE is not null and UNIT_TYPE <> ''";

    featureLayer2.queryFeatures(query2).then(function (response) {
      const features = response.features.sort(
        (a, b) => b.attributes["TOTALCOUNT"] - a.attributes["TOTALCOUNT"],
      );
      const attributes = features.map((feature) => feature.attributes);
      const types = attributes.map((attribute) => attribute["UNIT_TYPE"]);
      const values = attributes.map((attribute) => attribute["TOTALCOUNT"]);

      const myBarChart = echarts.init(document.getElementById("someChart"));

      myBarChart.setOption({
        title: {
          text: "ECharts Getting Started Example",
        },
        tooltip: {
          show: true,
          trigger: "item",
        },
        xAxis: {
          data: types,
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            data: values,
            type: "bar",
          },
        ],
      });
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  let inputValue = '';
  document.getElementById("form1").addEventListener("submit", (e) => {
    // debugger;
    e.preventDefault();
  });

  // Load the Map and MapView modules
  require(["esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer","esri/Graphic","esri/symbols/SimpleFillSymbol"], (
    Map,
    MapView,
    FeatureLayer,
    Graphic, 
    SimpleFillSymbol,
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
        inputValue = document.getElementById("filterInput").value;

        const selectedIndex = document.getElementById("fieldSelect").selectedIndex;
        const selectedFieldName = fields[selectedIndex - 1].name;
        const selectedFieldType = fields[selectedIndex - 1].type;
        if (inputValue === "") {
          featureLayer.definitionExpression = "1=1";
          return;
        }
        // debugger;
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
        queryAndDisplayFeatures(inputValue)
      });
      document.getElementById("fieldSelect").addEventListener("change", (e) => {
        document.getElementById("filterInput").value = "";
      });

      let selectedFieldName = "";
      document.getElementById("filterInput").addEventListener("input", (e) => {
        // debugger;
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
    function queryAndDisplayFeatures(inputValue) {
      const tableFields = ["AREA_ID", "POLYGON_NM", "Population"];
      let query = featureLayer.createQuery();
    
      query.where = "POLYGON_NM like '" + inputValue + "%'";
      query.outFields = ["*"];
      query.returnGeometry = true;
    
      featureLayer.queryFeatures(query).then((response) => {
        const features = response.features;
        console.log('features:', features);
        const attributes = features.map((feature) => feature.attributes);
        const geometries = features.map((feature) => feature.geometry);
        const featuresTable = document.getElementById("features-table");
        const featuresTableHeader = featuresTable.querySelector("thead");
        const featuresTableBody = featuresTable.querySelector("tbody");
    
        // Clear previous table contents
        featuresTableHeader.innerHTML = "";
        featuresTableBody.innerHTML = "";
    
        const headerTr = document.createElement("tr");
        featuresTableHeader.append(headerTr);
    
        tableFields.forEach((field) => {
          const th = document.createElement("th");
          th.textContent = field;
          headerTr.append(th);
        });
    
        attributes.forEach((attribute, index) => {
          const tr = document.createElement("tr");
          tr.id = index;
          tableFields.forEach((field) => {
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
    }
    queryAndDisplayFeatures('')
    // Example usage: Call this function with the input value when needed
    document.getElementById("form1").addEventListener("submit", (e) => {
      e.preventDefault(); // Prevent form submission
      const inputValue = document.getElementById("filterInput").value;
      queryAndDisplayFeatures(inputValue);
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
    //sum pup layer 1 y , b
    
  

    // setTimeout(() => {
    // //   view.zoom = 10;
    // //   view.center = [-100, 70];
    // }, 5000);
  });
});

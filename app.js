
var App = (function (App, $) {
  App.alarmData={}; //old alarm data to compare against new data and determining whether tables need to be updated
  App.diData={};  //old data items data to compare against new data and determining whether tables need to be updated
	App.modelNumber="nuclear_reactor"
	App.serialNumber="reactor_1"
	App.outsideData1=[]
	App.diffData=[]
  App.powerValues = null;

  App.init = function () {
    //example calls of how to use the functions
		App.getDataItems(App.modelNumber, App.serialNumber, App.populateDataItems)
  		//Getting the DataItems on modelNumber, serialNumber
  		//and then calling the App.populateDataItems method to populate the dataItems Table
      App.getAlarms(App.modelNumber, App.serialNumber, App.populateAlarms)
      App.getPowerData()
      App.loadSliders()
  		//Getting the DataItems on modelNumber, serialNumber
  		//and then calling the App.populateAlarms method to populate the alarms Table
      setInterval(function(){
          App.getDataItems(App.modelNumber, App.serialNumber,App.populateDataItems)
          App.getAlarms(App.modelNumber, App.serialNumber, App.populateAlarms)
          App.getPowerData()
      },5000)
		  //setting an interval to poll for new alarms and data values coming in
    }
    App.getPowerData = function() {
      App.call("GetCurrentOutput",{}, App.powerCallback)
    }

    App.powerCallback = function(data) {
      App.powerValues = data
    }


    //function to get data items data from the web service
  	//modelNumber is the model Number
  	//serialNumber is the serial Number
  	//callback is the function to call that uses the response data
    App.getDataItems=function(modelNumber, serialNumber, callback){
        App.call("vgs_getDataItemsCurrentValues",{
            "modelNumber":modelNumber,
            "serialNumber":serialNumber
        }, callback)
    }
  	//function to get Historical data values for a single data item
  	//modelNumber is the model Number
  	//serialNumber is the serial Number
  	//dataItem is the name of the data item to get data for
  	//numValues is the max number of values you want returned for the dataItem
  	//callback is the function to call that uses the response data
    App.getHistoricalValues=function(modelNumber, serialNumber, dataItem, numValues, callback){
        var numVals=numValues? numValues:25
        App.call("vgs_GetDataItems",{
            "modelNumber":modelNumber,
            "serialNumber":serialNumber,
            "dataitemName":dataItem,
            "numValues":numVals,
            "verbose":true
        }, callback)
    }
    //function to get alarm data from the web service
  	//modelNumber is the model Number
  	//serialNumber is the serial Number
  	//callback is the function to call that uses the response data
    App.getAlarms=function(modelNumber, serialNumber, callback){
        App.call("vgs_GetAlarms",{
            "modelNumber":modelNumber,
            "serialNumber":serialNumber
        }, callback)
    }
	  //plots the returned values from the response for historical values of the requested data item
    App.processHistoricalValues=function(json){
  		console.log(json)
          $(".ax_history").fadeIn()
  		var data=[]
          $.each(json.dataItemValues, function(i){
              data.push([new Date(json.dataItemValues[i].timestamp).getTime(), parseFloat(json.dataItemValues[i].value)])
          })
  		//building the data set to use for jquery flot
  		data.sort(function(a,b) {
  			return a[0] - b[0];
  		});
  		var from = Math.ceil(data[0][0]);
          var to = Math.ceil(data[data.length-1][0]);
  		var dataset={
              label: json.dataItemName,
              data: data,
  			      color:"#0072D0"
          }
  		var dataToUse=[]
  		dataToUse.push(dataset)
  		console.log(dataToUse)
  		options = {
  			xaxis: {
  				timezone: "browser",
  				mode: "time",
  				min:from-(0.1*(to-from)),
  				max:to+(0.1*(to-from))
  			},
  			series: {
  				lines: {
  					show: true
  				},
  				points:{
  					show: true
  				}
  			},
  			grid:{
  				hoverable:true
  			}
  		}
      $.plot(".ax_history", dataToUse, options)
    }
    //function to populate the data items table with data coming from web service to get the current values for all the data types
    App.populateDataItems=function(json){
      if(JSON.stringify(App.diData)!=JSON.stringify(json)){
        $.each(json.dataItemNames, function(i){
            if($("[data-item='"+json.dataItemNames[i].name+"']").length>0){
                $("[data-item='"+json.dataItemNames[i].name+"']").html("<td class='ax_ditems_col ax_ditems_col1'>"+json.dataItemNames[i].name+"</td><td class='ax_ditems_col ax_ditems_col2'>"+json.dataItemNames[i].type+"</td><td class='ax_ditems_col ax_ditems_col3'>"+json.dataItemNames[i].val+"</td><td class='ax_ditems_col ax_ditems_col4'>"+json.dataItemNames[i].timestamp+"</td>")
            }else{
                $(".ditems_tbody").append($("<tr class='ax_row' data-item='"+json.dataItemNames[i].name+"'><td class='ax_ditems_col ax_ditems_col1'>"+json.dataItemNames[i].name+"</td><td class='ax_ditems_col ax_ditems_col2'>"+json.dataItemNames[i].type+"</td><td class='ax_ditems_col ax_ditems_col3'>"+json.dataItemNames[i].val+"</td><td class='ax_ditems_col ax_ditems_col4'>"+json.dataItemNames[i].timestamp+"</td></tr>"))
            }
        })
  			var filtered1=json.dataItemNames.filter(function(a) {return a.name=="OutsideAirTemp1"})
  			var filtered2=json.dataItemNames.filter(function(a) {return a.name=="OutsideAirTemp2"})
  			if(filtered1.length>0 && filtered2.length>0){
  				var val=filtered1[0].val-filtered2[0].val
  				var time=filtered1[0].timestamp
  				if($("[data-item='OutsideAirTempDiff']").length>0){
  					$("[data-item='OutsideAirTempDiff']").html("<td class='ax_ditems_col ax_ditems_col1'>OutsideAirTempDiff</td><td class='ax_ditems_col ax_ditems_col2'>ANALOG</td><td class='ax_ditems_col ax_ditems_col3'>"+val+"</td><td class='ax_ditems_col ax_ditems_col4'>"+time+"</td>")
  				}else{
  					$(".ditems_tbody").append($("<tr class='ax_row' data-item='OutsideAirTempDiff'><td class='ax_ditems_col ax_ditems_col1'>OutsideAirTempDiff</td><td class='ax_ditems_col ax_ditems_col2'>ANALOG</td><td class='ax_ditems_col ax_ditems_col3'>"+val+"</td><td class='ax_ditems_col ax_ditems_col4'>"+time+"</td></tr>"))
  				}
  			}
        App.diData=json
      }
		  $(".ax_row").off("click.getHistory").on("click.getHistory", function(e){
  			if($(this).attr("data-item") && $(this).find(".ax_ditems_col2").html()=="ANALOG"){
  				if($(this).attr("data-item")=="OutsideAirTempDiff"){
  					console.log("got to the case")
  					App.getHistoricalForDerivedVariable()
  				}
  				else{
  					App.getHistoricalValues(App.modelNumber, App.serialNumber, $(this).attr("data-item"),25, App.processHistoricalValues)
  				}
  			}
		  })
    }
	App.getHistoricalForDerivedVariable=function(){
		console.log("Here it is")
		App.getHistoricalValues(App.modelNumber, App.serialNumber, "OutsideAirTemp1", 25, function(json){
			App.outsideData1=json.dataItemValues
		})
		setTimeout(function(){
			App.getHistoricalValues(App.modelNumber, App.serialNumber, "OutsideAirTemp2", 25, function(json){
				var outsideData2=json.dataItemValues
				console.log(outsideData2)
				console.log(App.outsideData1)
				$.each(outsideData2, function(i){
					App.diffData.push({"value":(App.outsideData1[i].value-outsideData2[i].value),"timestamp":outsideData2[i].timestamp})
				})
				var nJson={"dataItemValues":App.diffData, "dataItemName":"OutsideAirTempDiff"}
				App.processHistoricalValues(nJson)
			})
		},300)

	}
	App.returner=function(json){
		console.log(json.dataItemValues)
		return json.dataItemValues
	}

  App.loadSliders = function(callback) {
    $("#solar").slider({
      orientation: "horizontal",
      max: 100,
      value: 5,
      change: function (event, ui) {
        var num_plants = 10;
        var totalPower = ui.value * App.powerValues.solarOutput * num_plants
        $('#solar_percent').val(totalPower)
        $('#solar_bar').width((100*totalPower/20000000000) + "%")
      }
    });
    $("#wind").slider({
      orientation: "horizontal",
      max: 100,
      value: 5,
      change: function (event, ui) {
        var num_plants = 200;
        var totalPower = ui.value * App.powerValues.windOutput * num_plants
        $('#wind_percent').val(totalPower)
        $('#wind_bar').width((100*totalPower/20000000000) + "%")
      }
    });
    $("#nuclear").slider({
      orientation: "horizontal",
      max: 100,
      value: 5,
      change: function (event, ui) {
        var totalPower = ui.value * App.powerValues.nuclearOutput
        $('#nuclear_percent').val(totalPower)
        $('#nuclear_bar').width((100*totalPower/20000000000) + "%")
      }
    });
  }



  //function to populate the alarms table with data coming from web service requesting all the current alarms on the device
  App.populateAlarms=function(json){
      if(JSON.stringify(App.alarmData)!=JSON.stringify(json)){
          $.each(json.alarms, function(i){
              if($("[data-alarm='"+json.alarms[i].id+"']").length>0){
                  $("[data-alarm='"+json.alarms[i].id+"']").html("<td class='ax_alarms_col ax_alarms_col1'>"+json.alarms[i].name+"</td><td class='ax_alarms_col ax_alarms_col2'>"+json.alarms[i].severity+"</td><td class='ax_alarms_col ax_alarms_col3'>"+json.alarms[i].state+"</td><td class='ax_alarms_col ax_alarms_col4'>"+json.alarms[i].timestamp+"</td>")
              }else{
                  $(".alarms_tbody").append($("<tr class='ax_row' data-alarm='"+json.alarms[i].id+"'><td class='ax_alarms_col ax_alarms_col1'>"+json.alarms[i].name+"</td><td class='ax_alarms_col ax_alarms_col2'>"+json.alarms[i].severity+"</td><td class='ax_alarms_col ax_alarms_col3'>"+json.alarms[i].state+"</td><td class='ax_alarms_col ax_alarms_col4'>"+json.alarms[i].timestamp+"</td></tr>"))
              }
          })
          App.alarmData=json
      }
  }
  //function to make scripto calls to consume web services
	//name is the name of the web service
	//params are the parameters for the web service
	//returnTo is the callback function
	//method is GET/POST. Default method is POST
  App.call=function (name, params, returnTo, method) {
      var paramString = method == "GET" ? params : JSON.stringify(params);
      if (!method)method = "POST"
      return $.ajax({
            type: method,
            contentType: "application/json; charset=utf-8",
            dataType: "text",
            url: 'https://nucleus.axeda.com/services/v1/rest/Scripto/execute/' + name+ '?username=devDay&password=devDay123',
            data: paramString,
            async: true,
            complete: function (e) {
                if (e.responseText){
                    var obj = $.parseJSON(e.responseText)
                    return returnTo(obj)
                }
            },
            error: function (e) {
                console.log(e);
            }
        });
    }
    return App;
}(App || {}, jQuery));

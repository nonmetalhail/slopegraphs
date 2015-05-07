/**
 * Copyright 2012 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *
 *
 * @fileoverview 
 * d3.js visualization creating an interactive Slopegraph
 * uses Fusion Tables as the database
 * Explores datasets originally found at:
 * Oregon Environmental Public Health Tracking
 * https://epht.oregon.gov/
 * 
 * 
 * @author nahman@google.com (Elliot Nahman)
 *
 * d3 Slopegraph code adapted from:
 * Hamilton Ulmer
 * http://skedasis.com/d3/slopegraph/
 * https://github.com/hamilton/slopegraphs
 *
 */

var FT_API_KEY = 'AIzaSyAm9yWCV7JPCTHCJut8whOjARd7pwROFDQ'

// location of the json datafile
var json_file_location = 'json/slopegraph.json'
var default_dataset_1 = 'asthma male'
var default_dataset_2 = 'asthma female'

/* 
  datastructure to hold the json response
  fusion table table id and a title which should match the html select values
  selects are populated with these values
  the year values could be populated by calling a DESCRIBE on the table, etc
*/
var ft_datasets = {
  'asthma':{
    'title': 'Asthma',
    'subtitle':'total',
    'tid': '1AzMRV-2WSSNeLOalrKdX0sEKry3oIxwTwNnJAwA'
  },
  'asthma male':{
    'title': 'Asthma',
    'subtitle':'male',
    'tid': '1Z_oTv84uXB8pUg66wKszkndWMwtDK1CbmB3UGIA'
  },
  'asthma female':{
    'title': 'Asthma',
    'subtitle':'female',
    'tid': '1IabRRnJ2CspLTwLruJz8or6QjhGb6NEVvXy8JqQ'
  },
  'cancer':{
    'title': 'Cancer',
    'subtitle':'total',
    'tid': '1glNdT_IDaWxjw4Fv2SZgsi64_-2Yb7cdhnMfdSs'
  },
  'heart attack':{
    'title': 'Heart Attack',
    'subtitle':'total',
    'tid': '1Mwr9Fh2b_7kpjYXtxilXXxG8-juVB77yFoxSrqU'
  },
  'heart attack male':{
    'title': 'Heart Attack',
    'subtitle':'male',
    'tid': '1Nfy2UQf-6UyigUsqODE08rld-nc2fgiWTvpmA2M'
  },
  'heart attack female':{
    'title': 'Heart Attack',
    'subtitle':'female',
    'tid': '1bQYDsuGW-8igHMww5aqIbw-MNO79wQEBaTgCS6U'
  }
}
// //blue/yellow
// var color1 = "#ffd300"
// var color2 = "#3914af"
// //red/green
// var color1 = "#2EAC70"
// var color2 = "#F77143"
//red/green
var color1 = "#5895BD"
var color2 = "#7ED15A"

// General d3 vis setup
var WIDTH = 800;
var HEIGHT = 850;

var LEFT_MARGIN = 300;
var RIGHT_MARGIN = 300;
var TOP_MARGIN = 50;
var BOTTOM_MARGIN = 50;

var ELIGIBLE_SIZE = HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;

// create var for vis and data
var g = new slopeGraphBuilder();
var epht = {};

var DataSet = function (){
  this.data = {};
  this.name = '';
  this.set = '';
  this.year = '';
  this.tid = '';
  this.title = '';
  this.subtitle = '';

  this.set_set = function(set){
    this.set = set;
  };
  this.set_year = function(year){
    this.year = year;
  };
  this.set_tid = function(tid){
    this.tid = tid;
  };
  this.set_title = function(title){
    this.title = title;
  };
  this.set_subtitle = function(subtitle){
    this.subtitle = subtitle;
  };
};

$(document).ready(function(){
  // $.when(getJsonFile()).done(function(){
    console.log(ft_datasets)
    for(var item in ft_datasets){
      $('#data_set1').append('<option value = "'+
          item+'">'+toTitleCase(item)+'</option>');
      $('#data_set2').append('<option value = "'+
          item+'">'+toTitleCase(item)+'</option>');
    }

    // hard code the two default options for a more interesting start
    $('#data_set1 option[value="'+default_dataset_1+'"]').attr('selected', true);
    $('#data_set2 option[value="'+default_dataset_2+'"]').attr('selected', true);

    epht.data1 = new DataSet();
    epht.data2 = new DataSet();

    //set 
    epht.data1.set_set($('#data_set1 option:selected').attr('value'));
    epht.data2.set_set($('#data_set2 option:selected').attr('value'));
    // table
    epht.data1.set_tid(ft_datasets[epht.data1.set]['tid']);
    epht.data2.set_tid(ft_datasets[epht.data2.set]['tid']);
    //load and set years    
    $.when(getYears(epht.data1,'1'),getYears(epht.data2,'2')).done(function(){    
      //Black centered title
      epht.data1.set_title(ft_datasets[epht.data1.set]['title']);
      epht.data2.set_title(ft_datasets[epht.data2.set]['title']);
      //subtitles for calc grey side title
      epht.data1.set_subtitle(ft_datasets[epht.data1.set]['subtitle']);
      epht.data2.set_subtitle(ft_datasets[epht.data2.set]['subtitle']);

      //name: the grey title text for each side  
      DataSet.prototype.set_name = function(){
        // if they are the same set, then the person will compare years
        // so use years as names
        if(epht.data1.set == epht.data2.set){
          epht.data1.name = epht.data1.year;
          epht.data2.name = epht.data2.year;
        }
        // if they are different sets
        else{
          // are they male-female or comparison to avg comparison?
          if(epht.data1.title == epht.data2.title){
            epht.data1.name = epht.data1.subtitle;
            epht.data2.name = epht.data2.subtitle;
          }
          // or comparison for different diseases
          else{
            epht.data1.name = epht.data1.set;
            epht.data2.name = epht.data2.set;
          }
        }
      };
      epht.data1.set_name();
      epht.data2.set_name();

      /*
      functions with arguments in the done get called immediately; 
      so we would have to have: .done(g.createVis) and restructure 
      everything so no vars are passed which would be fairly easy, but 
      require more restucturing of the slopegraph code. 
      
      Wrapping createVis in an anon function allieviates this, 
      though looks funky
      */

      // when we get both datasets back from FT, create the vis
      $.when(getFTData(epht.data1),getFTData(epht.data2))
        .done(function(){
          g.createVis(epht.data1.name,epht.data2.name,
            epht.data1.data,epht.data2.data,epht.data1.title,epht.data2.title)
        });
      // when we get a dataset back after a change, update the vis. 
      DataSet.prototype.update_data = function(){
        $.when(getFTData(this))
          .done(function(){
            g.updateVis(epht.data1.name,epht.data2.name,
              epht.data1.data,epht.data2.data,epht.data1.title,epht.data2.title)
          });
      }
    });
  // });

  // create listeners to the selection menus
  $('#data_set1').live('change',function(){
    epht.data1.set_set(this.value);
    $.when(getYears(epht.data1,'1')).done(function(){
      epht.data1.set_title(ft_datasets[epht.data1.set]['title']);
      epht.data1.set_subtitle(ft_datasets[epht.data1.set]['subtitle']);
      epht.data1.set_tid(ft_datasets[epht.data1.set]['tid']);
      epht.data1.set_name();
      
      epht.data1.update_data();
    });
  });
  $('#data_set2').live('change',function(){
    epht.data2.set_set(this.value);
    $.when(getYears(epht.data2,'2')).done(function(){
      epht.data2.set_title(ft_datasets[epht.data2.set]['title']);
      epht.data2.set_subtitle(ft_datasets[epht.data2.set]['subtitle']);
      epht.data2.set_tid(ft_datasets[epht.data2.set]['tid']);
      epht.data2.set_name();

      epht.data2.update_data();
    });
  });

  $('#year1').live('change',function(){
    epht.data1.set_year(this.value);
    epht.data1.set_name();
    epht.data1.update_data();
  });
  $('#year2').live('change',function(){
    epht.data2.set_year(this.value);
    epht.data2.set_name();
    epht.data2.update_data();
  });
});

function toTitleCase(str)
{
  return str.replace(/\w\S*/g, 
    function(txt){
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function getJsonFile(){
  var d = $.Deferred();
  $.getJSON(json_file_location,function(resp){
    ft_datasets = resp;
  }).done(function(p){
    d.resolve(p);
  }).fail(d.reject);

  return d.promise();
}

function getYears(set,side){
  var d = $.Deferred();
  var FTURL = 'https://www.googleapis.com/fusiontables/v1/tables/';
  var tid = ft_datasets[set['set']]['tid'];
  var key = '?key='+FT_API_KEY;

  $.getJSON(FTURL+tid+key,function(resp){
    var tempYears = [];
    for(var i in resp['columns']){
      if(resp['columns'][i]["type"]=="NUMBER"){
        tempYears.push(resp['columns'][i]["name"]);
      }
      else{
        console.log("rejected col: " + resp['columns'][i]["name"]);
      }
    }
    tempYears.sort().reverse();
    $('#year'+side).children().remove();
    for(var i in tempYears){
      $('#year'+side).append('<option value = "'+
        tempYears[i]+'">'+tempYears[i]+'</option>');
    }
    $('#year'+side+' option[value="'+tempYears[0]+'"]').attr('selected', true);
    set.set_year($('#year'+side+' option:selected').attr('value'));
  }).done(function(p){
    d.resolve(p);
  }).fail(d.reject);

  return d.promise();
}

function getFTData(obj){
  var d = $.Deferred();
  var url = 'https://www.googleapis.com/fusiontables/v1/query?sql=';
  /*
  * query for data in the form of:
  * geography, rate, year
  *   county1, x,  2000
  *   county2, x,  2000
  *   county1, x,  2001
  *   county2, x,  2001
  */
  // var query = "SELECT col1,col0 FROM " + obj.tid + " WHERE 'Year'='"+ obj.year+"'"
  /*
  * query for data in the form of:
  * geography, year1, year2, ...
  *   county1, x1,  x2
  *   county2, x1,  x2
  */
  var query = "SELECT 'Geography','"+obj.year+"' FROM " + obj.tid;
  
  var encodedQuery = encodeURIComponent(query);
  var tail = '&key='+FT_API_KEY;
  console.log(url+encodedQuery+tail);
  $.getJSON(url+encodedQuery+tail,function(resp){
    console.log(url+encodedQuery+tail);
    console.log(resp);
    obj.data = resp;
  })
  .done(function(p){
    d.resolve(p);
  })
  .fail(d.reject);

  return d.promise();
}

function slopeGraphBuilder(){
/**
 *  reformats and returns data into a datatable:
 *  [
 *    {
 *      lable: text_name for both,
 *      left: value for left side,
 *      right: value for right side,
 *      left_coord: calculated y-position
 *      right_coord: calculated y-position
 *    }
 *  ]
**/
  _to_data = function (d1,d2){
    var y1d = d1["rows"];
    var y2d = d2["rows"];
    var _d = {};
    // takes first dataset and creates the table
    for (var k1 in y1d) {
      _d[y1d[k1][0]] = {};
      _d[y1d[k1][0]]['left'] = y1d[k1][1];
      _d[y1d[k1][0]]['right'] = 0;
      _d[y1d[k1][0]]['label'] = y1d[k1][0];
    }
    // takes second dataset and appends the table
    for (var k2 in y2d) {
      if (!_d.hasOwnProperty(y2d[k2][0])) {
        _d[y2d[k2][0]] = {};
        _d[y2d[k2][0]].left = 0;
        _d[y2d[k2][0]]['label'] = y2d[k2][0];
      }
      _d[y2d[k2][0]].right = y2d[k2][1];
      if (_d[y2d[k2][0]].right === NaN) {
        _d[y2d[k2][0]].right = 0;
      }
    }

    //converts _d from object of object to array of object
    dt = [];
    var di;
    for (var k in _d){
      di = _d[k];
      dt.push(di)
    }
    console.log(dt);
    return dt;
  }

  var _y = d3.scale.linear();

  function y(d,i){
    return HEIGHT - _y(d)
  }

  // Calculates range and y-vals for the datatable
  /* 
    Funny thing is it does so but then you have to 
    recalculate for each item; not sure why, didnt have time
    to figure out why and redo it so it only does once.
  */
  calcRange = function(data){

    _y.domain([_min_key(data), _max_key(data)])
      .range([TOP_MARGIN, HEIGHT-BOTTOM_MARGIN]);

    for (var i = 0; i < data.length; i += 1){
      data[i].left_coord = y(data[i].left);
      data[i].right_coord = y(data[i].right);
    }
  }

  //helper functions for calc ranges
  _max_key = function(v){
    var vi, max_side;
    var _m = undefined;
    for (var i = 0; i < v.length; i += 1){
      vi = v[i];
      max_side = Math.max(vi.left, vi.right)
      if (_m == undefined || max_side > _m) {
        _m = max_side;
      }
    }
    return _m;
  },

  _min_key = function(v){
    var vi, min_side;
    var _m = undefined;
    for (var i = 0; i < v.length; i += 1){
      vi = v[i];
      min_side = Math.min(vi.left, vi.right)
      if (_m == undefined || min_side < _m) {
        _m = min_side;
      }
    }
    return _m;
  }

  _min_max = function(v){
    var vi, min_side, max_side;
    var _max = undefined;
    var _min = undefined;

    for (var i = 0; i < v.length; i += 1){
      vi = v[i];
      min_side = Math.min(vi.left_coord, vi.right_coord);
      max_side = Math.max(vi.left_coord, vi.right_coord);

      if (_min == undefined || min_side < _min) {
        _min = min_side;
      }
      if (_max == undefined || max_side > _max) {
        _max = max_side;
      }
    }
    return [_min, _max];
  };

  _slopegraph_preprocess = function(d){
    // computes y coords for each data point
    // create two separate object arrays for each side, then order them together, and THEN run the shifting alg.
    var offset;

    var font_size = 15;
    var l = d.length;

    var max = _max_key(d);
    var min = _min_key(d);
    var range = max-min;

    //
    var left = [];
    var right = [];
    var di
    for (var i = 0; i < d.length; i += 1) {
      di = d[i];
      left.push({label:di.label, value:di.left, side:'left', coord:di.left_coord})
      right.push({label:di.label, value:di.right, side:'right', coord: di.right_coord})
    }

    var both = left.concat(right)
    both.sort(function(a,b){
      if (a.value > b.value){
        return 1
      } else if (a.value < b.value) {
        return -1
      } else { 
        if (a.label > b.label) {
          return 1
        } else if (a.lable < b.label) {
          return -1
        } else {
          return 0
        }
      }
    }).reverse()
    var new_data = {};
    var side, label, val, coord;
    for (var i = 0; i < both.length; i += 1) {

      label = both[i].label;
      side = both[i].side;
      val = both[i].value;
      coord = both[i].coord;

      if (!new_data.hasOwnProperty(both[i].label)) {
        new_data[label] = {}
      }
      new_data[label][side] = val;

      if (i > 0) {
        if (coord - font_size < both[i-1].coord || 
          !(val === both[i-1].value && side != both[i-1].side)) {
                  
          new_data[label][side + '_coord'] = coord + font_size;

          for (j = i; j < both.length; j += 1) {
            both[j].coord = both[j].coord + font_size;
          }
        } else {
          new_data[label][side + '_coord'] = coord;
        }

        if (val === both[i-1].value && side !== both[i-1].side) {
          new_data[label][side + '_coord'] = both[i-1].coord;
        }
      } 
      else {
        new_data[label][side + '_coord'] = coord;
      }

    }
    d = [];

    for (var label in new_data){  
      val = new_data[label];
      val.label = label;
      d.push(val)
    }

    return d;
  };

  this.formatData = function(dTable1,dTable2){
    var data = _to_data(dTable1,dTable2);
    calcRange(data);

    data = _slopegraph_preprocess(data);
    return data;
  }

  this.createVis = function(y1,y2,dTable1,dTable2,title1,title2){
    data = this.formatData(dTable1,dTable2);

    // var min, max;
    var _ = _min_max(data)
    this.min = _[0];
    this.max = _[1];

    _y.domain([this.max, this.min])
      .range([TOP_MARGIN, HEIGHT-BOTTOM_MARGIN])

    var sg = d3.select('#slopegraph')
      .append('svg:svg')
      .attr('width', WIDTH)
      .attr('height', HEIGHT);

    // group tag for the body of the vis in case we want to do global selections
    var g = sg.append('svg:g');

    // grey category title on the left
    this.y1t = sg.append('svg:text')
      .attr('x', LEFT_MARGIN)
      .attr('y', TOP_MARGIN/2)
      .attr('text-anchor', 'end')
      .attr('opacity', .5)
      .text(y1);

    // grey category title on the right
    this.y2t = sg.append('svg:text')
      .attr('x', WIDTH-RIGHT_MARGIN)
      .attr('y', TOP_MARGIN/2)
      .attr('opacity', .5)
      .text(y2);

    // Title underline
    sg.append('svg:line')
      .attr('x1', LEFT_MARGIN/2)
      .attr('x2', WIDTH-RIGHT_MARGIN/2)
      .attr('y1', TOP_MARGIN*2/3)
      .attr('y2', TOP_MARGIN*2/3)
      .attr('stroke', 'black')
      .attr('opacity', .5);

    // main black title
    this.title = sg.append('svg:text')
      .attr('x', WIDTH/2)
      .attr('y', TOP_MARGIN/2)
      .attr('text-anchor', 'middle')
      // text changes if select menu 1 & 2 have same set
      .text(function(){
        if(title1==title2){return title1 + ' Rates in Oregon'}
        else{return 'Disease Rates in Oregon'} })
      .attr('font-variant', 'small-caps');

    /*
    If I had written this from scratch, it probably would have made more sense to:
      group each set (same county ll, lv, slope, rv, rl) in a <g>
      Then addressing the group would be much easier
      each <g> could then have a attr for the county and classes applied to it instead
      This *might* also have made the animation work proper
    */

    // I will only mark up ll: others are all similar
    // left labels
    this.ll = g.selectAll('.left_labels')
      .data(data).enter().append('svg:text')
        .attr('x', LEFT_MARGIN-35)
        .attr('y', function(d,i){
          // recalculates coordinate
          // if the right and left are the same, return the same val
          // without this, sometimes they turn out different
          // would have to examine the collision detection to really fix
          return (d.right==d.left)?y(d.right_coord):y(d.left_coord)
        })
        .attr('dy', '.35em')
        .attr('font-size', 10)
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'end')
        // toUpperCase only applied to Oregon, others were already CAPS
        .text(function(d,i){ return d.label.toUpperCase()})
        .attr('fill', 'black')
        // replace is for Hood River; else interpreted as two separate classes
        .attr("class",function(d){return d.label.replace(' ','_')})
        .attr("cat","geo")
        .on("mouseover", fadeRest(24,0.2,2,false,true))
        .on("mouseout", fadeRest(10,1,1,false,false));

    // left values
    this.lv = g.selectAll('.left_values')
      .data(data).enter().append('svg:text')
        .attr('x', LEFT_MARGIN-10)
        .attr('y', function(d,i){
          return (d.right==d.left)?y(d.right_coord):y(d.left_coord)
        })
        .attr('dy', '.35em')
        .attr('font-size', 10)
        .attr('text-anchor', 'end')
        .text(function(d,i){ return d.left})
        .attr('fill', 'black')
        .attr("class",function(d){return d.label.replace(' ','_')})
        .attr("cat","val")
        .on("mouseover", fadeRest(24,0.2,2,false,true))
        .on("mouseout", fadeRest(10,1,1,false,false));

    // right labels
    this.rl = g.selectAll('.right_labels')
      .data(data).enter().append('svg:text')
        .attr('x', WIDTH-RIGHT_MARGIN)
        .attr('y', function(d,i){
          return y(d.right_coord)
        })
        .attr('dy', '.35em')
        .attr('dx', 35)
        .attr('font-weight', 'bold')
        .attr('font-size', 10)
        .text(function(d,i){ return d.label.toUpperCase()})
        .attr('fill', 'black')
        .attr("class",function(d){return d.label.replace(' ','_')})
        .attr("cat","geo")
        .on("mouseover", fadeRest(24,0.2,2,true,true))
        .on("mouseout", fadeRest(10,1,1,true,false));

    //right values
    this.rv = g.selectAll('.right_values')
      .data(data).enter().append('svg:text')
        .attr('x', WIDTH-RIGHT_MARGIN)
        .attr('y', function(d,i){
          return y(d.right_coord)
        })
        .attr('dy', '.35em')
        .attr('dx', 10)
        .attr('font-size', 10)
        .text(function(d,i){ return d.right})
        .attr('fill', 'black')
        .attr("class",function(d){return d.label.replace(' ','_')})
        .attr("cat","val")
        .on("mouseover", fadeRest(24,0.2,2,true,true))
        .on("mouseout", fadeRest(10,1,1,true,false));

    // slope lines
    this.slopes = g.selectAll('.slopes')
      .data(data).enter().append('svg:line')
        .attr('x1', LEFT_MARGIN)
        .attr('x2', WIDTH-RIGHT_MARGIN)
        .attr('y1', function(d,i){
          return (d.right==d.left)?y(d.right_coord):y(d.left_coord)
        })
        .attr('y2', function(d,i){
          return y(d.right_coord)
        })
        .attr('stroke', function(d){
          return (d.left-d.right)>0 ? color1:color2
        })
        // all lines grey instead of colored by +/-
        // .attr('stroke', '#777')
        /* experimented with changing stroke based on difference
           problem was outliers; would need to normalize somehow
           unless the story is about the outliers...*/
        // this is not copied to the update vis section
        // .attr("stroke-width",function(d){
        //   return Math.abs(d.left-d.right)/10+.5
          // return Math.pow(Math.abs(d.left-d.right),2)/400+Math.abs(d.left-d.right)/20+.5
        // })
        .attr("class",function(d){return d.label.replace(' ','_')})
        .on("mouseover", fadeRest(24,0.2,2,true,true))
        .on("mouseout", fadeRest(10,1,1,true,false));

    // sg.selectAll('text')
      
  }

  this.updateVis = function(y1,y2,dTable1,dTable2,title1,title2){
    data = this.formatData(dTable1,dTable2);

    _y.domain([this.max, this.min])
      .range([TOP_MARGIN, HEIGHT-BOTTOM_MARGIN]);

    this.title
      .text(function(){
        if(title1==title2){return title1 + ' Rates in Oregon'}
        else{return 'Disease Rates in Oregon'} });
    this.y1t
      .text(y1);
    this.y2t
      .text(y2);
    this.ll
      .data(data)
      .text(function(d,i){ return d.label.toUpperCase()})
      .transition()
      .duration(300)
      .ease('quad')
      .attr('y', function(d,i){
          return (d.right==d.left)?y(d.right_coord):y(d.left_coord)
        })
      .attr("class",function(d){return d.label.replace(' ','_')});

    this.lv
    .data(data)
    .text(function(d,i){ return d.left})
      .transition()
      .duration(300)
      .ease('quad')
      .attr('y', function(d,i){
          return (d.right==d.left)?y(d.right_coord):y(d.left_coord)
        })
      .attr("class",function(d){return d.label.replace(' ','_')});

    this.rl
      .data(data)
      .text(function(d,i){ return d.label.toUpperCase()})
      .transition()
      .duration(300)
      .ease('quad')
      .attr('y', function(d,i){
          return y(d.right_coord)
        })
      .attr("class",function(d){return d.label.replace(' ','_')});

    this.rv
    .data(data)
    .text(function(d,i){ return d.right})
      .transition()
      .duration(300)
      .ease('quad')
      .attr('y', function(d,i){
          return y(d.right_coord)
        })
      .attr("class",function(d){return d.label.replace(' ','_')});

    this.slopes
      .data(data)
      .transition()
      .duration(300)
      .ease('quad')
      .attr('y1', function(d,i){
        return (d.right==d.left)?y(d.right_coord):y(d.left_coord)
      })
      .transition()
      .duration(300)
      .ease('quad')
      .attr('y2', function(d,i){
        return y(d.right_coord)
      })
      .attr('stroke', function(d){
        return (d.left-d.right)>0 ? color1:color2
      })
      // all lines grey instead of colored by +/-
      // .attr('stroke', '#777')
      .attr("class",function(d){return d.label.replace(' ','_')});
  }

  // fade vis by setting opacity to .5
  function fadeRest(font_size,opacity,stroke,right,fade_in){
    return function(g,i){
      /* using this selector instead is then based on the filter in ('g > *')
         dont fully undertand this, but could be useful if you want to compare
         two different sets
      */
      // d3.selectAll('[cat="geo"]')
      d3.selectAll('.'+g.label+'[cat="geo"]')
        .style('opacity',1)
        .transition() 
        .duration(1000) 
        .ease("elastic", 4, .3)
        .attr('font-size',font_size);
      // d3.selectAll('[cat="geo"]')
      d3.selectAll('.'+g.label+'[cat="val"]')
        .style('opacity',1)
        .transition() 
        .duration(1000) 
        .ease("elastic", 4, .3)
        .attr('font-size',(fade_in)?font_size-10:font_size);

      d3.selectAll('line.'+ g.label.replace(' ','_'))
        .style('opacity',1)
        .transition() 
        .duration(1000) 
        .ease("elastic", 4, .3)
        .attr('stroke-width',stroke);
      
      d3.selectAll('g > text')
        .filter(function(d){
          return d.label != g.label
        })
        .attr('font-size',10)

      d3.selectAll('g > line')
        .filter(function(d){
          return d.label != g.label
        })
        .attr('stroke-width',1)

      d3.selectAll('g > *')
        .filter(function(d){
          return d.label != g.label && d.label != 'Oregon'
        })
        .transition().ease('exp').duration(500)
        .style('opacity',opacity);

      d3.selectAll('.Oregon')
        .style('opacity',1);

      if(fade_in){displayBox(g,right)}
      else{removeBox()};
    }
  }

  //shows the box
  // pass in the associated datatable and 
  // bool to indicate if the hover is on the right or left
  function displayBox(d,right) 
  { 
    console.log(d);
    var lVal = d.left;
    var rVal = d.right;
    // if on the right, use right coord, else use left
    var yRaw = (right)? y(d.right_coord) : y(d.left_coord);
    // move the box along with the graph, but dont move it off the top of window
    // var yCoord = (yRaw < 100)? yRaw : yRaw-100;
    var yCoord = yRaw-25;
    // round to 2 decimals
    var dv = Math.round((rVal-lVal)*100)/100;
    // if the difference is a positive value, add a +
    var diffVal = (dv > 0)? '+'+dv : dv;

    // set y location of info box
    d3.select("#infobox").style("top", yCoord);
    // set x location of infobox using class to override
    // default (right) sets right location
    // left sets a left location which overrides the right
    if(right){$('#infobox').removeClass("info_left")}
    else{$('#infobox').addClass("info_left")};  

    d3.select("#c_name").text(d.label);
    d3.select("#difference").text(diffVal);
    d3.select("#num_left").text(lVal);
    d3.select("#num_right").text(rVal);
    // shows the inforbox
    d3.select("#infobox").transition().delay(50).duration(500).ease('poly',19).style("opacity", 1);
  } 
  //hides the box again 
  function removeBox() 
  { 
      d3.select("#infobox").style("opacity", 0); 
  } 
}
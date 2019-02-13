/* 
 * D3 Script to visualize states.
 */

//
// Globals (Hints)
//
/* global d3 */

//
// Dimensions.
//
const WIDTH = 960;
const HEIGHT = 600;

const KEY_WIDTH = 240;
const KEY_HEIGHT = 20;

const KEY_X = (WIDTH - KEY_WIDTH) / 2;
const KEY_Y = 0;

//
// Constants
//
const INTERPERLATOR = d3.interpolateBuPu;//d3.interpolateBuGn;

var ACTIVE = "num_population";
var MODE = "_scale";

const RECOLOR_TIME = 1000;

var trans;
var INTERESTING;
var INTERESTING_FIELDS;

//
// Loads and merges all the data.
//
d3.queue()
        .defer(d3.csv, "data/states.csv")
        .defer(d3.csv, "data/compressed.csv")
        .defer(d3.csv, "data/interesting.csv")
        .await(function (error, statesData, compressedData, interestingData) {
            // Log the error code.
            if (error) {
                console.log("Error: " + error);
            }
            // Set interesting data.
            INTERESTING = interestingData;
            // Set interesting fields.
            INTERESTING_FIELDS = [];
            INTERESTING.forEach(function (e) {
                INTERESTING_FIELDS.push(e.field);
            });
            // Get the svg target.
            const svg = d3.select('#usa-map-chart')
                    .attr('viewBox', '0 0 ' + WIDTH + ' ' + HEIGHT)
                    .attr('preserveAspectRatio', 'xMidYMid meet');

            mergeStateData(statesData, compressedData, function (stateAbrMap, stateNameMap) {
                drawUSAMap(svg, WIDTH, HEIGHT, curry(stateConsumer, stateAbrMap, stateNameMap, d3.select("#usa-map-header"), d3.select("#usa-map-footer")), function () {
                    // Force a recolor
                    trans = trans = d3.transition().duration(RECOLOR_TIME).ease(d3.easeLinear);
                    svg.selectAll('*').dispatch('recolor');
                    // Swap out with loading icon.
                    d3.select("#usa-map-body-loading").remove();
                    d3.select("#usa-map-body-loaded").attr('hidden', null);
                });
            });
        });


//
// Merges all the data into a single map.
//
function mergeStateData(statesData, compressedData, callback) {
    // Create a State Map
    const stateAbrMap = new Map();
    const stateNameMap = new Map();

    // Load the statesData into the map.
    statesData.forEach(function (line) {
        // Add the state to the state id map.
        stateAbrMap.set(line.state_abr, line);
        // Add the state to the state name map.
        stateNameMap.set(line.state_name, line);
    });

    // Apply the compressed data to the state data.
    compressedData.forEach(function (line) {
        // Get the state associated with the compressed data line.
        const state = stateAbrMap.get(line.state_abr);
        // Ensure that the state was found.
        if (state !== undefined) {
            // Add the data to the state.
            d3.keys(line).forEach(function (key) {
                state[key] = getFromLine(line, key);
            });
        } else {
            // Log the invalid line.
            console.log("Invalid compressed line: " + line);
        }
    });

    // Get the states as an array.
    const states = Array.from(stateAbrMap.values());

    // Rank the objects.
    rankObjects(INTERESTING_FIELDS, states);

    // Find min/max objects.
    const min = minObjects(INTERESTING_FIELDS, states);
    const max = maxObjects(INTERESTING_FIELDS, states);
    const sum = sumObjects(INTERESTING_FIELDS, states);
    const avg = avgObjects(sum, states.length);
    
    // Scale the objects.
    scaleObjects(INTERESTING_FIELDS, states, min, max);
    
    // Percentify the objects.
    percentObjects(INTERESTING_FIELDS, states, sum);

    // Set the min/max names.
    min.state_abr = "min";
    min.state_name = "Minimum";
    max.state_abr = "max";
    max.state_name = "Maximum";
    sum.state_abr = "sum";
    sum.state_name = "Summation";
    avg.state_abr = "avg";
    avg.state_name = "Average";

    // Log min/max.
    console.log(min);
    console.log(max);
    console.log(sum);
    console.log(avg);

    // Add min/max to maps.
    stateAbrMap.set(min.state_abr, min);
    stateAbrMap.set(max.state_abr, max);
    stateAbrMap.set(sum.state_abr, sum);
    stateAbrMap.set(avg.state_abr, avg);
    stateNameMap.set(min.state_name, min);
    stateNameMap.set(max.state_name, max);
    stateNameMap.set(sum.state_name, sum);
    stateNameMap.set(avg.state_abr, avg);

    // Call the callback with the merged datasets.
    callback(stateAbrMap, stateNameMap);
}

//
// Draws the map.
//
function drawUSAMap(svg, width, height, stateConsumer, callback) {
    //Define map projection
    const projection = d3.geoAlbersUsa()
            .translate([width / 2, height / 2]);

    //Define path generator
    const pathGenerator = d3.geoPath()
            .projection(projection);

    // Create two svg layers.
    const defs = svg.append('defs');
    const stateBodies = svg.append('g').attr('id', 'state-bodies');
    const stateBorders = svg.append('g').attr('id', 'state-borders');
    const overlay = svg.append('g').attr('id', 'overlay');

    // Load and create the map.
    d3.json("json/us-states.json", function (jsonMapData) {
        // Draw the states.
        stateBodies.selectAll("path")
                .data(jsonMapData.features)
                .enter()
                .append("path")
                .attr("d", pathGenerator)
                .style("fill", "#ccc")
                .each(stateConsumer);
        // Draw the state borders.
        stateBorders.selectAll("path")
                .data(jsonMapData.features)
                .enter()
                .append("path")
                .attr("d", pathGenerator)
                .attr("class", "state-border")
                .attr("stroke", 'lightgray')
                .attr("fill", "none");
        // Call the function finish callback.
        callback();
    });

    // Add in the key.
    addColorscaleKey(defs, overlay, INTERPERLATOR, "colorscale", "Relative Value", "Low", "High");
}

//
// State function.
//
function stateConsumer(stateAbrMap, stateNameMap, titleTarget, infoTarget, state) {
    // Fetch the state object associated with this JSON object.
    const stateObj = stateNameMap.get(state.properties.NAME);

    // Log the state object.
    //console.log(stateObj);

    // Fetch min/max.
    const min = stateAbrMap.get('min');
    const max = stateAbrMap.get('max');
    const sum = stateAbrMap.get('sum');
    const avg = stateAbrMap.get('avg');

    // Modify the state.
    d3.select(this)
            .on("click", function (d) {
                titleTarget.selectAll('*').remove();
                infoTarget.selectAll('*').remove();
                titleTarget.append('h2')
                        .attr('class', 'state-title')
                        .text((1 + stateObj[ACTIVE + "_rank"]) + ": " + stateObj.state_name);
                createInterestingTable(infoTarget, stateObj, min, max, sum, avg, INTERESTING, function (table, row, prop, object) {
                    if (INTERESTING_FIELDS.includes(prop)) {
                        table.selectAll('tr').classed('active', false);
                        row.classed('active', true);
                        ACTIVE = prop;
                        console.log("Setting active to: \"" + ACTIVE + "\"");
                        trans = d3.transition().duration(RECOLOR_TIME).ease(d3.easeLinear);
                        d3.selectAll('svg').selectAll('*').dispatch('recolor');
                    }
                }).attr('class', 'state-info _col_1');
            })
            .on("mouseover", function (d) {
                scaleInPlace(this, 0.9);
            })
            .on("mouseout", function (d) {
                d3.select(this).attr('transform', null);
            })
            .on("recolor", function (d) {
                d3.select(this).transition(trans).style("fill", curry(determineColor, stateNameMap));
            });
}

//
// Simple Color Determination Funtion
//
function determineColor(stateNameMap, d) {
    return INTERPERLATOR(stateNameMap.get(d.properties.NAME)[ACTIVE + MODE]);
}

//
// Simple Chart Key Function
//
function addColorscaleKey(defs, svg, interpolator, colorscaleId, title, min, max) {
    // Add the colorscale to the defs section.
    colorscalify(defs, interpolator, colorscaleId);

    // Create the key holder.
    let key = svg.append("g")
            .attr("id", "key")
            .attr("transform", "translate(" + KEY_X + "," + KEY_Y + ")");

    // Create a key border.
    key.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', KEY_WIDTH)
            .attr('height', KEY_HEIGHT)
            .attr('fill', 'url(#' + colorscaleId + ')');
    key.append('text')
            .attr('x', KEY_WIDTH * 5 / 100)
            .attr('y', KEY_HEIGHT * 3 / 4)
            .attr('text-anchor', 'start')
            .attr('fill', '#3e4444')
            .text(min);
    key.append('text')
            .attr('x', KEY_WIDTH * 50 / 100)
            .attr('y', KEY_HEIGHT * 7 / 4)
            .attr('text-anchor', 'middle')
            .attr('fill', '#333333')
            .text(title);
    key.append('text')
            .attr('x', KEY_WIDTH * 95 / 100)
            .attr('y', KEY_HEIGHT * 3 / 4)
            .attr('text-anchor', 'end')
            .attr('fill', '#f4f4f4')
            .text(max);
}

//
// Utility Functions
//
function curry(uncurried) {
    var parameters = Array.prototype.slice.call(arguments, 1);
    return function () {
        return uncurried.apply(this, parameters.concat(
                Array.prototype.slice.call(arguments, 0)
                ));
    };
}

function rgb(r, g, b) {
    return "rgb(" + r + "," + g + "," + b + ")";
}

function colorscalify(defs, interpolator, id) {
    // Add colorscale gradient.
    const colorscale = defs.append('linearGradient').attr('id', id);
    // Add the stop points based off of the interpolator function.
    for (var i = 0; i < 100; i++) {
        colorscale.append('stop')
                .attr('stop-color', interpolator(i / 100))
                .attr('offset', i + '%');
    }
    // Return the colorscale.
    return colorscale;
}

function getFromLine(line, key) {
    // If key starts with num_ convert to number.
    if (key.startsWith("num_")) {
        return +[line[key]];
    } else if (key.startsWith("per_")) {
        return +[line[key]];
    } else {
        return line[key];
    }
}

function scaleValue(value, min, max) {
    return (value - min) / (max - min);
}

function scaleInPlace(e, scale) {
    let bounds = e.getBBox();
    let cx = bounds.x + bounds.width / 2;
    let cy = bounds.y + bounds.height / 2;
    return d3.select(e).attr('transform', 'translate(' + cx + ',' + cy + ') scale(' + scale + ') translate(' + (-cx) + ',' + (-cy) + ')');
}

function minObjects(fields, objects) {
    // Create the max object.
    const min = {};
    // Go throught each object.
    objects.forEach(function (e) {
        // Loop through each property.
        fields.forEach(function (prop) {
            // If the property is undefined, simply copy over.
            if (min[prop] === undefined) {
                min[prop] = e[prop];
            }
            // Otherwise only copy if greater.
            else if (e[prop] < min[prop]) {
                min[prop] = e[prop];
            }
        });
    });
    // Return the max object.
    return min;
}

function maxObjects(fields, objects) {
    // Create the max object.
    const max = {};
    // Go throught each object.
    objects.forEach(function (e) {
        // Loop through each property.
        fields.forEach(function (prop) {
            // If the property is undefined, simply copy over.
            if (max[prop] === undefined) {
                max[prop] = e[prop];
            }
            // Otherwise only copy if greater.
            else if (e[prop] > max[prop]) {
                max[prop] = e[prop];
            }
        });
    });
    // Return the max object.
    return max;
}

function sumObjects(fields, objects) {
    // Create the max object.
    const sum = {};
    // Go throught each object.
    objects.forEach(function (e) {
        // Loop through each property.
        fields.forEach(function (prop) {
            // If the property is undefined, simply copy over.
            if (sum[prop] === undefined) {
                sum[prop] = +[e[prop]];
            }
            // Otherwise add to the sum.
            else {
                sum[prop] += +[e[prop]];
            }
        });
    });
    // Return the sum object.
    return sum;
}

function avgObjects(sumObject, objectCount) {
    // Create the max object.
    const avg = {};
    // Go throught each object.
    for (var prop in sumObject) {
        avg[prop] = sumObject[prop] / objectCount;
    }
    // Return the sum object.
    return avg;
}

function rankObjects(fields, objects) {
    // Go through ranking fields.
    fields.forEach(function (prop) {
        // Rank the objects based off of the propery.
        objects.sort(function (a, b) {
            if (a[prop] > b[prop]) {
                return -1;
            } else if (a[prop] < b[prop]) {
                return 1;
            } else {
                return 0;
            }
        });
        // Set a new rank property in each object.
        for (var i = 0; i < objects.length; i++) {
            objects[i][prop + "_rank"] = i;
        }
    });
}

function scaleObjects(fields, objects, min, max) {
    // Go through each object.
    objects.forEach(function (e) {
        // Go through each field.
        fields.forEach(function (prop) {
            // Scale the value.
            e[prop + "_scale"] = scaleValue(e[prop], min[prop], max[prop]);
        });
    });
}

function percentObjects(fields, objects, sum) {
    // Go through each object.
    objects.forEach(function (e) {
        // Go through each field.
        fields.forEach(function (prop) {
            // Percentify the value.
            e[prop + "_percent"] = e[prop] / sum[prop];
        });
    });
}

function createInterestingTable(target, object, min, max, sum, avg, interesting, onRowClick) {
    // Create the container div.
    let container = target.append('div')
            .attr('id', name);

    // Create the loading div.
    let loading = container.append('div')
            .attr('class', '_full');

    // Set the loading content.
    loading.append('img')
            .attr('src', '/img/loading.svg')
            .attr('alt', 'Loading...')
            .attr('class', '_center');

    // Create the loaded div.
    let loaded = container.append('div')
            .attr('hidden', '')
            .style('overflow', 'auto');

    // Create the table.
    let table = loaded.append('table')
            .attr('class', '_center');

    // Get the table parts.
    let table_head = table.append('thead');
    let table_body = table.append('tbody');
    let table_foot = table.append('tfoot');

    // Get the headers.
    let headers = ["Datapoint", "Value", "Minimum", "Maximum", "Total", "Average", "Rank", "Scale", "Percent"];

    // Put the header row.
    let table_head_row = table_head.append('tr');

    // Add each header.
    headers.forEach(function (e) {
        table_head_row.append('th')
                .attr('id', e)
                .text(e);
    });

    // Put interesting data in the table.
    interesting.forEach(function (e) {
        // Create a new row.
        let row = table_body.append('tr');
        // Add click listener.
        row.on("click", function () {
            onRowClick(table, row, e.field, object);
        });
        // If this is active, make active.
        if (e.field === ACTIVE) {
            row.classed("active", true);
        }
        // For each header add a cell.
        row.append('td').attr('headers', headers[0]).text(e.name);
        row.append('td').attr('headers', headers[1]).text(object[e.field]);
        row.append('td').attr('headers', headers[2]).text(min[e.field].toFixed(2));
        row.append('td').attr('headers', headers[3]).text(max[e.field].toFixed(2));
        row.append('td').attr('headers', headers[4]).text(sum[e.field].toFixed(2));
        row.append('td').attr('headers', headers[5]).text(avg[e.field].toFixed(2));
        row.append('td').attr('headers', headers[6]).text(object[e.field + "_rank"]);
        row.append('td').attr('headers', headers[7]).text(object[e.field + "_scale"].toFixed(4));
        row.append('td').attr('headers', headers[7]).text((object[e.field + "_percent"] * 100).toFixed(2) + "%");
    });

    // Swap out with loading icon.
    loading.remove();
    loaded.attr('hidden', null);

    // Return the table.
    return container;
}
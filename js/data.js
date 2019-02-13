/* 
 * D3 Script to visualize plane patterns.
 */

//
// Globals (Hints)
//
/* global d3 */

//
// Load the data table
//
function loadDataTable(targetId, data) {
    // Get the target.
    let target = d3.select("#" + targetId);

    // Create the loading div.
    let loading = target.append('div')
            .attr('class', '_full')
            .attr('id', targetId + "-loading");

    // Set the loading content.
    loading.append('img')
            .attr('src', 'img/loading.svg')
            .attr('alt', 'Loading...')
            .attr('class', '_center');

    // Create the loaded div.
    let loaded = target.append('div')
            .attr('hidden', '')
            .attr('id', targetId + "-loaded")
            .style('overflow', 'auto');
    
    // Create the table name.
    let tableId = targetId + '-data-table';

    // Create the table.
    let table = loaded.append('table')
            .attr('id', tableId)
            .attr('class', '_center');

    // Get the table parts.
    let table_head = table.append('thead');
    let table_body = table.append('tbody');
    let table_foot = table.append('tfoot');

    // Get the headers.
    let headers = d3.keys(data[0]);

    // Put the header row.
    let table_head_row = table_head.append('tr');
    
    // Add each header.
    headers.forEach(function (e) {
        table_head_row.append('th')
                .attr('id', e)
                .text(e);
        console.log(e);
    });

    // Put the State data in the table.
    data.forEach(function (line) {
        // Create a new row.
        let row = table_body.append('tr');
        // For each header add a cell.
        headers.forEach(function (col) {
            row.append('td').attr('headers', col).text(line[col]);
        });
    });

    // Swap out with loading icon.
    loading.remove();
    loaded.attr('hidden', null);
}

//
// Do some data processing.
//
d3.csv("data/compressed.csv", data => loadDataTable('state-data-body', data));

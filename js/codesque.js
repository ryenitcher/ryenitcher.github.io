/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* global w3 */

//
// Insert the navbar. Only works with backend present, so commented out and done manually.
//
$.get("fragments/navbar.html", function(data){
    // Actually insert.
    $("#navbar").replaceWith(data);
    // Set the active tab.
    setNavActive();
});

//
// Set the active navbar tab when the page is loaded.
//
$(document).ready(setNavActive);

//
// Set the active page in the navbar.
//
function setNavActive() {
    let path = window.location.pathname;
    path = path.replace(/\/$/, "");
    path = decodeURIComponent(path);
    
    // Resolve base domain to index page.
    if (path === "") {
        path = "/index.html";
    }
    
    //console.log("Current path: " + path);

    $(".navbar-tab a").each(function () {
        let href = $(this).attr('href');
        let inferred = path.substring(path.length - href.length, path.length);
        //console.log("Looking at: " + href);
        //console.log("Comparing to: " + inferred);
        if (inferred === href) {
            $(this).closest('li').addClass('active');
        }
    });
}

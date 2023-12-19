// CONFIGURATION #################################################################################

// CIG seams to store the pagesize in session.
// Since we overwrite it with 1 in pledge deeplinks,
// we have to fix it in all other links to the pledges list.
// Edit this number to your preferences:
var SFI_PLEDGE_LIST_PAGE_SIZE = 10;

// none, manufacturer or insurance
var SFI_DEFAULT_FLEET_GROUP = 'none';

// none, type
var SFI_DEFAULT_EQUIPMENT_GROUP = 'none';

var SFI_DEFAULT_SHOW_UNASSIGNED_PAINTS_CARD = false;

// LOAD SCRIPT ###################################################################################

if (typeof SFI_ASYNC == undefined) {
    var SFI_ASYNC = false;
}

$(function () {
    'use strict';

    if (SFI_ASYNC == true) return;
    SFI_ASYNC = true;

    let widget = document.createElement('script');
    widget.setAttribute('src', 'https://sophie-kuehn.github.io/sc-fleet-info/fleetInfo.js');
    widget.setAttribute('async', 'async');
    document.body.appendChild(widget);
});

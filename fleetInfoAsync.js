// CONFIGURATION #################################################################################

// CIG seams to store the pagesize in session.
// Since we overwrite it with 1 in pledge deeplinks,
// we have to fix it in all other links to the pledges list.
// Edit this number to your preferences:
var SFI_PLEDGE_LIST_PAGE_SIZE = 10;

// LOAD SCRIPT ###################################################################################

const SFI_ASYNC = true;
$(function () {
    'use strict';
    let widget = document.createElement('script');
    widget.setAttribute('src', 'https://sophie-kuehn.github.io/sc-fleet-info/fleetInfo.js');
    widget.setAttribute('async', 'async');
    document.body.appendChild(widget);
});

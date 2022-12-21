if (typeof SFI_ASYNC === 'undefined') {
// CONFIGURATION #################################################################################

    // CIG seams to store the pagesize in session.
    // Since we overwrite it with 1 in pledge deeplinks,
    // we have to fix it in all other links to the pledges list.
    // Edit this number to your preferences:
    var SFI_PLEDGE_LIST_PAGE_SIZE = 10;

// END OF CONFIGURATION ##########################################################################
} else {
    console.log(SFI_ASYNC);
    console.log(SFI_PLEDGE_LIST_PAGE_SIZE);
}

$(function () {
    'use strict';
// MAPPINGS ######################################################################################

    const VERSION = '1.5.2';

    const INSURANCE_TYPE_LTI = 'lti';
    const INSURANCE_TYPE_IAE = 'iae';
    const INSURANCE_TYPE_MONTHLY = 'monthly';

    const MANUFACTURER_MAP = {
        'ANVL': ['Anvil Aerospace', 'Anvil'],
        'AEGS': ['Aegis Dynamics', 'Aegis'],
        'AOPOA': ['Aopoa'],
        'ARGO': ['ARGO Astronautics', 'ARGO'],
        'BANU': ['Banu'],
        'CNOU': ['Consolidated Outland', 'Consolidated', 'C.O.'],
        'CRUS': ['Crusader Industries', 'Crusader'],
        'DRAK': ['Drake Interplanetary', 'Drake'],
        'ESPERIA': ['Esperia'],
        'ESPR': ['Esperia'],
        'GRIN': ['Greycat Industrial', 'Greycat'],
        'KRGR': ['Kruger Intergalactic', 'Kruger'],
        'KRIG': ['Kruger Intergalactic', 'Kruger'],
        'MISC': ['MISC', 'Musashi Industrial & Starflight Concern', 'M.I.S.C.'],
        'ORIG': ['Origin Jumpworks', 'Origin Jumpworks GmbH', 'Origin'],
        'RSI': ['Roberts Space Industries', 'RSI', 'R.S.I.'],
        'TMBL': ['Tumbril'],
        'VANDUUL': ['Vanduul'],
        'XIAN': ['Xi\'an'],
        'GAMA': ['Gatac Manufacture', 'Gatac']
    };

    const FLEETYARDS_SHIP_NAME_FIXES = {
        'Hercules Starlifter A2': 'A2 Hercules',
        'Hercules Starlifter C2': 'C2 Hercules',
        'Hercules Starlifter M2': 'M2 Hercules',
        'F7CM Super Hornet': 'F7C-M Super Hornet',
        'GRIN ROC DS': 'ROC DS',
        'Genesis Starliner': 'GENESIS',
        'MPUV C': 'MPUV CARGO'
    };

    // when matching these models, look for the stated alternative names
    const ALTERNATIVE_SHIP_MODEL_NAMES = {
        'Mercury Star Runner': ['Star Runner'],
        'GRIN ROC DS': ['ROC'],
        '100i': ['100 series'],
        '125a': ['100 series'],
        '135c': ['100 series'],
        'A1 Spirit': ['Spirit'],
        'C1 Spirit': ['Spirit'],
        'E1 Spirit': ['Spirit'],
        'C8R Pisces': ['C8 Pisces'],
        'C8X Pisces': ['C8 Pisces'],
        'C8X Pisces Expedition': ['C8 Pisces']
    };

    // when matching these models, don't use the soft short name matching
    const STRICT_SHIP_MATCHING = {
        'Sabre Raven': true,
        'Hull A': true,
        'Hull B': true,
        'Hull C': true,
        'Hull D': true,
        'Hull E': true
    };

    // if these are found in the skin name, expect the model name (needed eg for sub-type-only skins)
    const STRICT_SHIP_MATCHING_REVERSE = {
        'Cutlass Black': 'Cutlass Black'
        //'Ares Radiance': 'Radiance',
        //'Ares Ember': 'Ember'
    };

// STYLESHEETS AND HTTP TEMPLATES ################################################################

    const STYLESHEETS = `
        .skButtonBox {
            float: right;
        }
        
        .skButtonBox a {
            padding: 0;
            float: right;
            margin-left: 20px;
        }
    
        .skFleetList {
            display: flex;
            flex-wrap: wrap;
            color: #bdced4;
            font-size: 0.8em;
        }
        
        .skFleetList a {
            color: rgb(189, 206, 212);
        }
        
        .skShipBox {
            width: 25%;
            position: relative;
        }
        
        .skInnerShipBox {
            background-color: rgba(23,29,37,0.5);
            padding: 10px;
            margin: 5px;
        }
        
        .skImageBox {
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            height: 110px;
        }
        
        .skInfoBox {
            margin: 0;
            padding: 0;
        }
        
        .skInfoLine {
            border-top: 1px solid rgb(29, 45, 66);
            padding: 3px 0;
            position: relative;
        }
        
        .skInfoLineOverlay {
            position: absolute;
            right: 110%;
            top: 0;
            padding: 3px;
            border: 3px solid rgb(29, 45, 66);
            background-color: rgba(23, 29, 37, 0.5);
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            display: none;
            z-index: 999;
        }
        
        .skNameBox {
            border-top: none;
            padding: 3px 0 0 0;
            font-size: 1.2em;
            color: rgb(97, 216, 253);
        }
        
        .skModelBox {
            border-top: none;
            padding: 3px 0 0 0;
            position: relative;
        }
        
        .skModelBox a {
            display: inline-block;
            width: 90%;
        }
        
        .skModelBoxBelowName {
            font-size: 0.9em;
        }
        
        .skModelBoxStandAlone {
            padding: 3px 0 0 0;
            font-size: 1.2em;
            color: rgb(97, 216, 253);
        }
        
        .skModelBoxStandAlone a {
            color: rgb(97, 216, 253);
        }
        
        .skModelBoxIcons {
            position: absolute;
            right: 0;
            top: 0;
            margin: 0;
            padding: 0;
        }
        
        .skManufacturerBox {
            border: none;
            padding: 0;
            font-size: 0.8em;
        }
        
        .skManufacturerBox.withBorder {
            border-bottom: 3px solid rgb(29, 45, 66);
            padding: 0 0 6px 0;
        }
    `;

    const HTML_TPL = {};
    HTML_TPL.link = $('<a target="_blank"></a>');
    HTML_TPL.shipList = $('<div class="skFleetList">Loading ...</div>');
    HTML_TPL.shipBox = $('<div class="skShipBox"></div>');
    HTML_TPL.shipBoxInner = $('<div class="skInnerShipBox"></div>');
    HTML_TPL.imageBox = $('<div class="skImageBox"></div>');
    HTML_TPL.infoBox = $('<ul class="skInfoBox"></ul>');
    HTML_TPL.infoLine = $('<li class="skInfoLine"></li>');
    HTML_TPL.infoLineOverlay = $('<div class="skInfoLineOverlay"></div>');
    HTML_TPL.nameBox =  $('<li class="skInfoLine skNameBox"></li>');
    HTML_TPL.modelBox =  $('<li class="skInfoLine skModelBox"></li>');
    HTML_TPL.modelBoxBelowName =  $('<li class="skInfoLine skModelBox skModelBoxBelowName"></li>');
    HTML_TPL.modelBoxStandAlone =  $('<li class="skInfoLine skModelBox skModelBoxStandAlone"></li>');
    HTML_TPL.modelBoxIcons = $('<ul class="skModelBoxIcons"></ul>');
    HTML_TPL.manufacturerBox =  $('<li class="skInfoLine skManufacturerBox"></li>');

// PLEDGE PROCESSING #############################################################################

    let ships = [];
    let equipment = {};
    let skins = {};
    let upgrades = {};

    const addShip = function(
        pledgeNumber,
        name,
        model,
        manufacturer,
        insuranceType,
        insuranceDuration,
        gamePackage,
        image
    ) {
        let bestInShowMatch = /\d+\sBest\sin\sShow/gi;

        let ship = {
            pledgeNumber: pledgeNumber,
            insuranceType: insuranceType,
            insuranceDuration: insuranceDuration,
            image: image,
            gamePackage: gamePackage,
            name: name,
            manufacturerNames: MANUFACTURER_MAP[manufacturer] || [manufacturer],
            bestInShow: model.search(bestInShowMatch) !== -1
        };

        $.each(ship.manufacturerNames, function(mi, manufacturerName) {
            model = model.replace(new RegExp(manufacturerName, 'gi'), '');
        });

        model = model.replace(/-/gi, '');
        model = model.replace(bestInShowMatch, '');
        model = model.trim();

        ship.model = model;
        ship.shortModel = model.split(' ')[0];
        ship.altModelNames = ALTERNATIVE_SHIP_MODEL_NAMES[ship.model] || [];
        ship.fleetYardsModelName = FLEETYARDS_SHIP_NAME_FIXES[ship.model] || ship.model;

        ships.push(ship);
    };

    const addSkin = function(data)
    {
        if (skins[data.title] === undefined) {
            data.count = 1;
            data.attached = false;
            skins[data.title] = data;
        } else {
            skins[data.title].count++;
        }
    }

    const addEquipment = function(data)
    {
        if (equipment[data.title] === undefined) {
            data.count = 1;
            data.attached = false;
            equipment[data.title] = data;
        } else {
            equipment[data.title].count++;
        }
    }

    const addUpgrade = function(data)
    {
        if (upgrades[data.title] === undefined) {
            data.count = 1;
            data.attached = false;
            upgrades[data.title] = data;
        } else {
            upgrades[data.title].count++;
        }
    }

    let pledgeNumber = 0;
    const processPledges = function(body)
    {
        $('.list-items li', body).each((index, el) => {
            pledgeNumber++;
            const $pledge = $(el);

            let pledgeImage = $('div.image', $pledge).css('background-image');
            let gamePackage = false;
            let insurances = {};

            $pledge.find('.without-images .item .title').each((i, elItem) => {
                let title = $(elItem).text().trim();

                if (/Star\sCitizen\sDigital\sDownload/i.test(title)) {
                    gamePackage = true;

                } else if (/Lifetime\s+Insurance/i.test(title)) {
                    insurances.lti = true;

                } else if (/IAE\s+Insurance/i.test(title)) {
                    insurances.iae = true;

                } else {
                    let insuranceRegexResult = /(\d+)(\s+|-)Months?\s+Insurance/i.exec(title);
                    if (insuranceRegexResult !== null && insuranceRegexResult[1]) {
                        let duration = parseInt(insuranceRegexResult[1]);
                        if (duration > 0) insurances.monthly = duration;
                    }
                }
            });

            let insuranceType = null;
            let insuranceDuration = null;

            if (insurances.lti !== undefined) {
                insuranceType = INSURANCE_TYPE_LTI;
            }
            else if (insurances.iae !== undefined) {
                insuranceType = INSURANCE_TYPE_IAE;
                insuranceDuration = 120;
            }
            else if (insurances.monthly !== undefined) {
                insuranceType = INSURANCE_TYPE_MONTHLY;
                insuranceDuration = insurances.monthly;
            }

            // browse the items without image
            $pledge.find('.without-images .item .title').each((i, elItem) => {
                let title = $(elItem).text().trim();
                let image = pledgeImage;
                let type = "Miscellaneous";

                if (/Digital\sDownload/i.test(title)
                    || /Wallpaper/i.test(title)
                    || /Insurance/i.test(title)
                    || /Name Reservation/i.test(title)
                ) return;

                if (/Origin\s+G12[ar]/i.test(title)) {
                    const shipInfoRegexResult = /(Origin)\s+(G12[ar])/i.exec(title);
                    addShip(
                        pledgeNumber,
                        '',
                        shipInfoRegexResult[2],
                        shipInfoRegexResult[1],
                        insuranceType,
                        insuranceDuration,
                        gamePackage,
                        image
                    );
                    return;
                }

                if (/(Skin|Paint)/i.test(title)) {
                    addSkin({
                        title: title,
                        pledgeNumber: pledgeNumber,
                        image: image
                    });
                    return;
                }

                addEquipment({
                    title: title,
                    pledgeNumber: pledgeNumber,
                    image: image,
                    type: type
                });
            });

            // browse the items with image
            $('.with-images .item', $pledge).each((i, elItem) => {
                const $item = $(elItem);

                let title = $('.title', $item).text();
                let liner = $('.liner span', $item).text();

                let type = $item.find('.kind').text();
                if (type.length === 0) type = "Miscellaneous";

                let image = pledgeImage;
                if ($item.find('.image').length !== 0) {
                    image = $('.image', $item).css('background-image');
                }

                if (/Wallpaper/i.test(title)) return;

                // skins
                if (/(Skin|Paint)/i.test(type) || /(Skin|Paint)/i.test(title)) {
                    addSkin({
                        title: title,
                        pledgeNumber: pledgeNumber,
                        image: image
                    });
                    return;
                }

                // upgrades
                if (/(Upgrade\s-)/i.test(title) && /(to)/i.test(title)) {
                    let upgradeTitle = title;
                    upgradeTitle = upgradeTitle.replace("Standard Edition", "");
                    upgradeTitle = upgradeTitle.replace("Warbond Edition", "");
                    upgradeTitle = upgradeTitle.trim();
                    let parts = upgradeTitle.split('-')[1].split(' to ')

                    addUpgrade({
                        title: upgradeTitle,
                        pledgeNumber: pledgeNumber,
                        from: parts[0].trim(),
                        to: parts[1].trim(),
                        image: image
                    });
                    return;
                }

                // ptv as decoration special case
                if (/(Hangar\sdecoration)/i.test(type) && /(Greycat\sPTV)/i.test(title)) {
                    addShip(
                        pledgeNumber,
                        '',
                        title,
                        liner,
                        insuranceType,
                        insuranceDuration,
                        gamePackage,
                        image
                    );
                    return;
                }

                // ship
                if (/(Ship)/i.test(type)) {
                    addShip(
                        pledgeNumber,
                        $('.custom-name-text', $item).text(),
                        title,
                        liner,
                        insuranceType,
                        insuranceDuration,
                        gamePackage,
                        image
                    );
                    return;
                }

                addEquipment({
                    title: title,
                    pledgeNumber: pledgeNumber,
                    image: image,
                    type: type
                });
            });
        })
    };

// RENDERING #####################################################################################

    const stringMatchesShip = function(haystack, ship, strict = false)
    {
        if (haystack.search(new RegExp(ship.model, "i")) !== -1) return true;

        let altNameFound = false;
        $.each(ship.altModelNames, function(iterator, name) {
            if (haystack.search(new RegExp(name, "i")) !== -1) {
                altNameFound = true;
                return false; // stopping $.each
            }
        });

        if (altNameFound) return true;
        if (strict || STRICT_SHIP_MATCHING[ship.model] !== undefined) return false;
        if (haystack.search(new RegExp(ship.shortModel, "i")) === -1) return false;

        let result = true;
        $.each(STRICT_SHIP_MATCHING_REVERSE, function(needle, model) {
            if (haystack.search(new RegExp(needle, "i")) !== -1
                && ship.model.search(new RegExp(model, "i")) === -1
            ) {
                result = false;
                return false; // stopping $.each
            }
        });
        return result;
    };

    const getPledgeLink = function(pledgeNumber)
    {
        return 'https://robertsspaceindustries.com/account/pledges?page=' + pledgeNumber + '&pagesize=1';
    };

    const prepareLink = function(content, href, colored)
    {
        let link = HTML_TPL.link.clone();
        link.attr('href', href);
        link.append(content);
        return link;
    };

    const renderShip = function(ship, infos)
    {
        let inner = HTML_TPL.shipBoxInner.clone();

        // image
        if (ship.image !== undefined) {
            let imageBox = HTML_TPL.imageBox.clone();
            imageBox.css('background-image', ship.image);
            inner.append(imageBox);
        }

        // infos below image
        let infoBox = HTML_TPL.infoBox.clone();
        inner.append(infoBox);

        // individual ship name + model name
        let modelBox;
        if (ship.name !== undefined
            && ship.name.length > 0
        ) {
            let nameBox = HTML_TPL.nameBox.clone();
            nameBox.text(ship.name);
            infoBox.append(nameBox);

            modelBox = HTML_TPL.modelBoxBelowName.clone();
        } else {
            modelBox = HTML_TPL.modelBoxStandAlone.clone();
        }

        modelBox.append(prepareLink(
            ship.model,
            getPledgeLink(ship.pledgeNumber)
        ));
        infoBox.append(modelBox);

        // icons on the right of ship model name
        let icons = HTML_TPL.modelBoxIcons.clone();
        modelBox.append(icons);

        if (ship.fleetYardsModelName !== undefined
            && ship.fleetYardsModelName.length > 0
        ) {
            let fyLink = $('<li></li>');
            fyLink.append(prepareLink(
                $('<img title="FleetYards" width="15" src="data:image/png;base64,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" />'),
                'https://fleetyards.net/ships/' + ship.fleetYardsModelName.replace(/ /g, "-").toLowerCase() + '/'
            ));
            icons.append(fyLink);
        }

        // manufacturer
        let manuBox = HTML_TPL.manufacturerBox.clone();
        if (ship.manufacturerNames !== undefined
            && ship.manufacturerNames.length >= 1
        ) manuBox.text(ship.manufacturerNames[0]);
        infoBox.append(manuBox)

        if (infos.length > 0) {
            manuBox.addClass('withBorder');
        }

        // additional lines of info
        $.each(infos, function(iterator, info) {
            let infoLine = HTML_TPL.infoLine.clone();

            if (info.link !== undefined && info.link.length > 0) {
                infoLine.append(prepareLink(info.text, info.link));
            } else {
                infoLine.text(info.text);
            }

            if (info.image !== undefined && info.image.length > 0) {
                let overlay = HTML_TPL.infoLineOverlay.clone();
                overlay.css("background-image", info.image);
                overlay.css("width", "130px");
                overlay.css("height", "80px");

                infoLine.append(overlay);
                infoLine.hover(function(){
                    overlay.css("display", "block");
                }, function(){
                    overlay.css("display", "none");
                });
            }

            infoBox.append(infoLine);
        });

        let shipBox = HTML_TPL.shipBox.clone();
        shipBox.append(inner);
        return shipBox;
    };

    const renderFleet = function(fleetList)
    {
        fleetList.empty();

        ships.sort((a,b) => (a.model > b.model) ? 1 : ((b.model > a.model) ? -1 : 0));

        $.each(ships, function(index, ship) {
            let infos = [];

            if (ship.gamePackage) {
                infos.push({text:"Game Package"});
            }

            if (ship.bestInShow) {
                infos.push({text:"Best in Show Variant"});
            }

            if (ship.insuranceType === INSURANCE_TYPE_LTI) {
                infos.push({text:"Life Time Insurance"});
            } else if (ship.insuranceType != null) {
                infos.push({text:ship.insuranceDuration + " Months Insurance"});
            }

            $.each(upgrades, function(iterator, upgrade) {
                if (!stringMatchesShip(upgrade.from, ship, true)) return;
                upgrade.attached = true;
                let text = "Upgrade to " + upgrade.to;
                if (upgrade.count > 1) text = text + " (" + upgrade.count + ")";
                infos.push({
                    text: text,
                    image: upgrade.image,
                    link: getPledgeLink(upgrade.pledgeNumber)
                });
            });

            $.each(skins, function(iterator, skin) {
                if (!stringMatchesShip(skin.title, ship)) return;
                skin.attached = true;

                let skinName = skin.title;
                skinName = skinName.replace(ship.model, "");
                skinName = skinName.replace(ship.shortModel, "");
                $.each(ship.altModelNames, function(ani, altName) {
                    skinName = skinName.replace(new RegExp(altName, "i"), "");
                });
                $.each(ship.manufacturerNames, function(mi, manufacturerName) {
                    skinName = skinName.replace(new RegExp(manufacturerName, "i"), "");
                });
                skinName = skinName.replace("Series", "");
                skinName = skinName.replace("-", "");
                skinName = skinName.trim();
                if (skin.count > 1) skinName = skinName + " (" + skin.count + ")";
                infos.push({
                    text: skinName,
                    image: skin.image,
                    link: getPledgeLink(skin.pledgeNumber)
                });

            });

            fleetList.append(renderShip(ship, infos));
        });

        let missingUpgradeShips = {};

        $.each(upgrades, function(iterator, upgrade) {
            if (upgrade.attached) return;
            let text = "Upgrade to " + upgrade.to;
            if (upgrade.count > 1) text = text + " (" + upgrade.count + ")";
            let info = {
                text: text,
                image: upgrade.image,
                link: getPledgeLink(upgrade.pledgeNumber)
            };

            if (missingUpgradeShips[upgrade.from] === undefined) {
                missingUpgradeShips[upgrade.from] = {
                    shipName: upgrade.from,
                    upgrades: [{text:"No ship"}, info]
                };
            } else {
                missingUpgradeShips[upgrade.from].upgrades.push(info);
            }
        });

        $.each(missingUpgradeShips, function(iterator, missingUpgradeShip) {
            fleetList.append(renderShip({
                model: missingUpgradeShip.shipName
            }, missingUpgradeShip.upgrades));
        });

        let missingSkins = [];

        $.each(skins, function(iterator, skin) {
            if (skin.attached) return;

            let text = skin.title;
            if (skin.count > 1) text = text + " (" + skin.count + ")";
            let info = {
                text: text,
                image: skin.image,
                link: getPledgeLink(skin.pledgeNumber)
            };

            missingSkins.push(info);
        });

        if (missingSkins.length > 0) {
            fleetList.append(renderShip({model: "Unassigned Ship Skins"}, missingSkins));
        }
    };

    const renderEquipment = function(fleetList)
    {
        fleetList.empty();

        let sortedEquipment = Object.keys(equipment).sort().reduce((a, c) => (a[c] = equipment[c], a), {});

        $.each(sortedEquipment, function(iterator, equipmentItem) {
            let text = equipmentItem.title;
            if (equipmentItem.count > 1) text = text + " (" + equipmentItem.count + ")";
            fleetList.append(renderShip({
                model: text,
                image: equipmentItem.image,
                pledgeNumber: equipmentItem.pledgeNumber,
                manufacturerNames: [equipmentItem.type]
            }, []));
        });
    };

    const preparePage = function(pageTitle)
    {
        let innerContent = $('.inner-content');

        let top = $('<div class="top"></div>');

        let buttonBox = $('<div class="skButtonBox"></div>');
        top.append(buttonBox);

        $('<div>').load('https://sophie-kuehn.github.io/sc-fleet-info/VERSION', function (response, status) {
            if (response.trim() === VERSION) return;
            let updateLink = $('<a href="https://github.com/sophie-kuehn/sc-fleet-info" target="_blank" class="shadow-button trans-02s trans-color"><span class="label js-label trans-02s">Updates available!</span><span class="left-section"></span><span class="right-section"></span></a>');
            buttonBox.append(updateLink);
        });

        innerContent.empty();
        innerContent.css('box-sizing', 'inherit').append(top);
        let title = $('<h2 class="title">' + pageTitle + '</h2>');
        top.append(title);

        let sep = $('<div style="clear:both" class="separator"></div>');
        top.append(sep);

        let fleetList = HTML_TPL.shipList.clone();
        innerContent.append(fleetList);

        return fleetList;
    };

// LOAD DATA AND TRIGGER RENDER ##################################################################

    let dataLoaded = false;
    const loadData = function(page, callback)
    {
        if (dataLoaded) return callback();

        const url = '/account/pledges?pagesize=50&page=' + page;
        const $page = $('<div>');
        $page.load(url + ' .page-wrapper', function (response, status) {
            if ($('.list-items .empy-list', this).length > 0) {
                dataLoaded = true;
                return callback();
            }
            processPledges(this);
            loadData(page+1, callback);
        });
    };

    const renderEquipmentPage = function()
    {
        $('div.sidenav ul li').removeClass('active');
        $('.showEquipmentButton').addClass('active');
        let fleetList = preparePage("MY EQUIPMENT");
        loadData(1, function(){
            logDebugInfo();
            renderEquipment(fleetList);
        });
    };

    const renderFleetPage = function()
    {
        $('div.sidenav ul li').removeClass('active');
        $('.showFleetsButton').addClass('active');
        let fleetList = preparePage("MY FLEET");
        loadData(1, function(){
            logDebugInfo();
            renderFleet(fleetList);
        });
    };

    let debugInfoLogged = false;
    const logDebugInfo = function()
    {
        if (debugInfoLogged) return;
        console.log(skins);
        console.log(upgrades);
        console.log(ships);
        console.log(equipment);
        debugInfoLogged = true;
    }

// INJECT NAVIGATION AND STYLESHEET ##############################################################

    let nav = $('div.sidenav ul li');
    if (nav.length > 0) {
        let newNav = $(nav[0]).clone();
        newNav.removeClass('active');
        newNav.addClass('showEquipmentButton');
        newNav.find('.bg').text('MY EQUIPMENT');
        newNav.find('a').attr('href', 'javascript:void(0)');
        newNav.find('a').click(renderEquipmentPage);
        $('div.sidenav ul').prepend(newNav);

        let newNavB = $(nav[0]).clone();
        newNavB.removeClass('active');
        newNavB.addClass('showFleetsButton');
        newNavB.find('.bg').text('MY FLEET');
        newNavB.find('a').attr('href', 'javascript:void(0)');
        newNavB.find('a').click(renderFleetPage);
        $('div.sidenav ul').prepend(newNavB);
    }

    // CIG seams to store the pagesize in session.
    // Since we overwrite it with 1 in pledge deeplinks,
    // we have to fix it in all other links to the pledges list.
    $("a").each((index, element) => {
        let href = $(element).attr('href');
        if (href != undefined && href.search(/^\/account\/pledges/i) != -1) {
            href = href.replace(/(\&|)pagesize\=\d+(\&|)/, "");
            let delim = '?';
            if (href.search(/\?/) != -1) delim = '&';
            $(element).attr('href', href + delim + 'pagesize=' + SFI_PLEDGE_LIST_PAGE_SIZE);
        }
    });

    $('head').append('<style>' + STYLESHEETS + '</style>');
});

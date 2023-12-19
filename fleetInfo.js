// CONFIGURATION #################################################################################

// CIG seams to store the pagesize in session.
// Since we overwrite it with 1 in pledge deeplinks,
// we have to fix it in all other links to the pledges list.
// Edit this number to your preferences:
var SFI_PLEDGE_LIST_PAGE_SIZE = SFI_PLEDGE_LIST_PAGE_SIZE ?? 10;

// none, manufacturer or insurance
var SFI_DEFAULT_FLEET_GROUP = SFI_DEFAULT_FLEET_GROUP ?? 'none';

// none, type
var SFI_DEFAULT_EQUIPMENT_GROUP = SFI_DEFAULT_EQUIPMENT_GROUP ?? 'none';

var SFI_DEFAULT_SHOW_UNASSIGNED_PAINTS_CARD = false;

// END OF CONFIGURATION ##########################################################################

if (typeof SFI_DONE == undefined) {
    var SFI_DONE = false;
}

$(function () {
    'use strict';

    if (SFI_DONE == true) return;
    SFI_DONE = true;

// MAPPINGS ######################################################################################

    const VERSION = '1.9.0';

    const INSURANCE_TYPE_LTI = 'lti';
    const INSURANCE_TYPE_IAE = 'iae';
    const INSURANCE_TYPE_MONTHLY = 'monthly';

    const AVAILABLE_EQUIPMENT_GROUPS = {
        "none": "null",
        "type": ".skManufacturerBox"
    };

    const AVAILABLE_FLEET_GROUPS = {
        "none": "null",
        "manufacturer": ".skManufacturerBox",
        "insurance": ".skShipInsurance"
    };

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
        'C8X Pisces Expedition': ['C8 Pisces'],
        'Hercules Starlifter A2': ['A2 Hercules'],
        'Hercules Starlifter C2': ['C2 Hercules'],
        'Hercules Starlifter M2': ['M2 Hercules'],
        '600i Exploration Module': ['600i Explorer']
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
        
        .skButtonBox > * {
            padding: 0;
            float: right;
            margin-left: 20px;
        }


        .skButtonBox input[type="checkbox"] {
            margin-left: 5px;
            vertical-align: text-bottom;
        }

        .skButtonBox select {
            background: #000;
            color: #fff;
            font-size: 1em;
            padding: 2px 7px;
            border: 1px solid #b3d4fc;
            margin-left: 5px;
            border-radius: 4px;
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

        .skGroupHeaderBox {
            width: 100%;
            position: relative;    
            border-bottom: 2px solid #8cf1ff;
            padding: 20px 0 10px 0;
            color: #8cf1ff;    
            margin-bottom: 10px;
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
            width: 130px;
            height: 80px;
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
            top: 1px;
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

        .skFleetYardsLink {
            line-height: 0px;
            width: 15px;
            height: 15px;
            display: inline-block;
            background-size: contain;
            vertical-align: middle;
            background-image: url("data:image/png;base64,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");
        }
    `;

    const HTML_TPL = {};
    HTML_TPL.link = $('<a target="_blank"></a>');
    HTML_TPL.shipList = $('<div class="skFleetList">Loading ...</div>');
    HTML_TPL.shipBox = $('<div class="skShipBox"></div>');
    HTML_TPL.groupHeaderBox = $('<div class="skGroupHeaderBox"></div>');
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
    HTML_TPL.fleetYardsIcon = $('<span class="skFleetYardsLink"></span>');
    HTML_TPL.manufacturerBox =  $('<li class="skInfoLine skManufacturerBox"></li>');
    HTML_TPL.pageButtonBox = $('<div class="skButtonBox"></div>');
    HTML_TPL.pageButton = $('<a class="shadow-button trans-02s trans-color"><span class="label js-label trans-02s"></span><span class="left-section"></span><span class="right-section"></span></a>');
    HTML_TPL.pageButtonAsDiv = $('<div class="shadow-button trans-02s trans-color"><span class="label js-label trans-02s"></span><span class="left-section"></span><span class="right-section"></span></div>');

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
        image,
        pledgeValue
    ) {
        let bestInShowMatch = /\d+\sBest\sin\sShow/gi;

        let ship = {
            pledgeNumber: pledgeNumber,
            pledgeValue: pledgeValue,
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
            let pledgeValue = $pledge.find('.js-pledge-value').attr('value');

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
                        image,
                        pledgeValue
                    );
                    return;
                }

                if (/(Skin|Paint)/i.test(title)) {
                    addSkin({
                        title: title,
                        pledgeNumber: pledgeNumber,
                        pledgeValue: pledgeValue,
                        image: image
                    });
                    return;
                }

                addEquipment({
                    title: title,
                    pledgeNumber: pledgeNumber,
                    pledgeValue: pledgeValue,
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
                        pledgeValue: pledgeValue,
                        image: image
                    });
                    return;
                }

                // upgrades
                if (/(Upgrade\s-)/i.test(title) && /(to)/i.test(title)) {
                    let upgradeTitle = title;
                    upgradeTitle = upgradeTitle.replace("Standard Edition", "");
                    upgradeTitle = upgradeTitle.replace("Warbond Edition", "");
                    upgradeTitle = upgradeTitle.replace("Standard Upgrade", "");
                    upgradeTitle = upgradeTitle.replace("Standard ...", "");
                    upgradeTitle = upgradeTitle.replace("Upgrade -", "");
                    upgradeTitle = upgradeTitle.trim();
                    let parts = upgradeTitle.split(' to ');

                    addUpgrade({
                        title: upgradeTitle,
                        pledgeNumber: pledgeNumber, 
                        pledgeValue: pledgeValue,
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
                        image,
                        pledgeValue
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
                        image,
                        pledgeValue
                    );
                    return;
                }

                addEquipment({
                    title: title,
                    pledgeNumber: pledgeNumber, 
                    pledgeValue: pledgeValue,
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

    const getPledgeValueTitle = function(pledgeValue)
    {
        return pledgeValue !== undefined ? 'pledge value: ' + pledgeValue : undefined;
    };

    const prepareLink = function(content, href, title)
    {
        let link = HTML_TPL.link.clone();
        link.attr('href', href);
        link.append(content);
        
        if (title !== undefined && title.length > 0) {
            link.attr('title', title);
        }

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
            getPledgeLink(ship.pledgeNumber),
            getPledgeValueTitle(ship.pledgeValue)
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
                HTML_TPL.fleetYardsIcon.clone(),
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

            if (info.className !== undefined) {
                infoLine.addClass(info.className);
            }

            if (info.link !== undefined && info.link.length > 0) {
                infoLine.append(prepareLink(info.text, info.link, info.linkTitle));
            } else {
                infoLine.text(info.text);
            }

            if (info.image !== undefined && info.image.length > 0) {
                let overlay = HTML_TPL.infoLineOverlay.clone();
                overlay.css("background-image", info.image);

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

        $.each(ships, function(index, ship) {
            let infos = [];

            if (ship.gamePackage) {
                infos.push({text:"Game Package"});
            }

            if (ship.bestInShow) {
                infos.push({text:"Best in Show Variant"});
            }

            if (ship.insuranceType === INSURANCE_TYPE_LTI) {
                infos.push({text:"Life Time Insurance", className:"skShipInsurance"});
            } else if (ship.insuranceType != null) {
                infos.push({text:ship.insuranceDuration + " Months Insurance", className:"skShipInsurance"});
            }

            $.each(upgrades, function(iterator, upgrade) {
                if (!stringMatchesShip(upgrade.from, ship, true)) return;
                upgrade.attached = true;
                let text = "Upgrade to " + upgrade.to;
                if (upgrade.count > 1) text = text + " (" + upgrade.count + ")";
                infos.push({
                    text: text,
                    image: upgrade.image,
                    link: getPledgeLink(upgrade.pledgeNumber),
                    linkTitle: getPledgeValueTitle(upgrade.pledgeValue)
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
                    link: getPledgeLink(skin.pledgeNumber),
                    linkTitle: getPledgeValueTitle(skin.pledgeValue)
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
                link: getPledgeLink(upgrade.pledgeNumber),
                linkTitle: getPledgeValueTitle(upgrade.pledgeValue)
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
            let box = renderShip({model: missingUpgradeShip.shipName}, missingUpgradeShip.upgrades);
            box.addClass('skSortBack');
            fleetList.append(box);
        });

        let missingSkins = [];

        $.each(skins, function(iterator, skin) {
            if (skin.attached) return;

            let text = skin.title;
            if (skin.count > 1) text = text + " (" + skin.count + ")";
            let info = {
                text: text,
                image: skin.image,
                link: getPledgeLink(skin.pledgeNumber),
                linkTitle: getPledgeValueTitle(skin.pledgeValue)
            };

            missingSkins.push(info);
        });

        if (missingSkins.length > 0) {
            let box = renderShip({model: "Unassigned Ship Paints"}, missingSkins);
            box.addClass('skSortBack').addClass('skUnassignedPaints');
            fleetList.append(box);
        }
    };

    const renderEquipment = function(fleetList)
    {
        fleetList.empty();

        $.each(equipment, function(iterator, equipmentItem) {
            let text = equipmentItem.title;
            if (equipmentItem.count > 1) text = text + " (" + equipmentItem.count + ")";
            fleetList.append(renderShip({
                model: text,
                image: equipmentItem.image,
                pledgeNumber: equipmentItem.pledgeNumber,
                pledgeValue: equipmentItem.pledgeValue,
                manufacturerNames: [equipmentItem.type]
            }, []));
        });
    };

    const addPageButton = function(href, text, target = '_blank', root = $('.skButtonBox'))
    {
        let button = HTML_TPL.pageButton.clone();
        button.attr('href', href);
        button.attr('target', target);
        button.find('.label').text(text);
        root.append(button);
        return button;
    };

    const addPageFormSelect = function(label, options, initial, onChange, root = $('.skButtonBox'))
    {
        let form = $('<select></select>');
        form.change(onChange);

        let wrapper = HTML_TPL.pageButtonAsDiv.clone();
        wrapper.find('.label').text(label + ':').append(form);
        root.append(wrapper);
        
        $.each(options, function(name, value) {
            let option = $('<option></option>');
            option.attr('value', value);
            option.text(name);
            form.append(option);
            
            if (initial === name) {
                option.attr('selected', 'selected');           
                form.change(); 
            }
        });

        return form;
    };

    const addPageFormCheckbox = function(label, onChange, defaultToggled = false, root = $('.skButtonBox'))
    {
        let form = $('<input type="checkbox"></input>');
        form.prop('checked', defaultToggled);  

        form.change(onChange);

        let wrapper = HTML_TPL.pageButtonAsDiv.clone();
        wrapper.find('.label').text(label + ':').append(form);
        root.append(wrapper);

        return form;
    };

    const preparePage = function(pageTitle)
    {
        let innerContent = $('.page-wrapper .inner-content');
        innerContent.empty();
        innerContent.css('box-sizing', 'inherit');

        let top = $('<div class="top"></div>');
        innerContent.append(top);

        let buttonBox = HTML_TPL.pageButtonBox.clone();
        top.append(buttonBox);

        top.append($('<h2 class="title">' + pageTitle + '</h2>'));
        top.append($('<div style="clear:both" class="separator"></div>'));

        let fleetList = HTML_TPL.shipList.clone();
        innerContent.append(fleetList);

        let updateLink = addPageButton('https://github.com/sophie-kuehn/sc-fleet-info', 'v' + VERSION);
        if (typeof SFI_ASYNC === 'undefined') {
            $('<div>').load('https://sophie-kuehn.github.io/sc-fleet-info/VERSION', function (response, status) {
                if (response.trim() === VERSION) return;
                updateLink.find('.label').text('v' + VERSION + ' - Update available!');
            });
        }

        return fleetList;
    };

// GROUPING AND SORTING ##########################################################################

    const sortObjectByKeys = function(object)
    {
        return Object.keys(object).sort().reduce((a, c) => (a[c] = object[c], a), {});
    };

    const sortObjectArrayByProperty = function(array, propertyName)
    {
        return array.sort((a,b) => (a[propertyName] > b[propertyName]) ? 1 : ((b[propertyName] > a[propertyName]) ? -1 : 0));
    };

    const sortDomArrayByContents = function(array, className)
    {
        array.sort(function(a,b){
            let aText = $(a).find(className).text();
            let bText = $(b).find(className).text();
            let aSortBack = $(a).hasClass('skSortBack');
            let bSortBack = $(b).hasClass('skSortBack');
            if (aSortBack && !bSortBack) return 1;
            if (!aSortBack && bSortBack) return -1;
            if (aText > bText) return 1;
            if (aText < bText) return -1;
            return 0;
        });
        return array;
    };

    const groupAndSortBoxes = function(list, groupOn, sortBy)
    {
        list.find('.skGroupHeaderBox').remove();
        const FALLBACK_GROUP = 'ZZZ';
        let grouped = {};
  
        $.each(list.find('.skShipBox'), function(i, box) {
            let group = (groupOn === null ? '' : $(box).find(groupOn).text());
            if (group.length === 0) group = FALLBACK_GROUP;
            if (grouped[group] === undefined) grouped[group] = [];
            grouped[group].push(box);
        });

        let groupCount = Object.keys(grouped).length;
        if (groupCount > 1) grouped = sortObjectByKeys(grouped);

        $.each(grouped, function(group, boxes) {
            if (groupCount > 1) {
                let header = HTML_TPL.groupHeaderBox.clone();
                if (group === FALLBACK_GROUP) group = 'Other';
                header.text(group);
                list.append(header);
            }            
            
            boxes = sortDomArrayByContents(boxes, sortBy);

            $.each(boxes, function(i, box) {
                list.append(box);
            });
        });
    }

// LOAD DATA AND TRIGGER RENDER ##################################################################

    let dataLoading = false;
    let dataLoaded = false;
    const loadData = function(page, callback)
    {
        if (dataLoaded) return callback();
        dataLoading = true;

        const url = '/account/pledges?pagesize=50&page=' + page;
        const $page = $('<div>');
        $page.load(url + ' .page-wrapper', function (response, status) {
            if ($('.list-items .empy-list', this).length > 0) {
                dataLoaded = true;
                dataLoading = false;
                return callback();
            }
            processPledges(this);
            loadData(page+1, callback);
        });
    };

    const renderEquipmentPage = function()
    {
        if (dataLoading) return;
        $('div.sidenav ul li').removeClass('active');
        $('.showEquipmentButton').addClass('active');
        let fleetList = preparePage("MY EQUIPMENT");
        loadData(1, function(){
            logDebugInfo();
            renderEquipment(fleetList);         
            addPageFormSelect('Group by', AVAILABLE_EQUIPMENT_GROUPS, SFI_DEFAULT_EQUIPMENT_GROUP, function() {
                let groupOn = (this.value === 'null' ? null : this.value);
                groupAndSortBoxes(fleetList, groupOn, '.skModelBox');
            });
        });
    };

    const renderFleetPage = function()
    {
        if (dataLoading) return;
        $('div.sidenav ul li').removeClass('active');
        $('.showFleetsButton').addClass('active');
        let fleetList = preparePage("MY FLEET");
        loadData(1, function(){
            logDebugInfo();
            renderFleet(fleetList);           
            addPageFormSelect('Group by', AVAILABLE_FLEET_GROUPS, SFI_DEFAULT_FLEET_GROUP, function() {
                let groupOn = (this.value === 'null' ? null : this.value);
                groupAndSortBoxes(fleetList, groupOn, '.skModelBox');
            });
            addPageFormCheckbox('Show unassigned paints card', function() {
                $('.skUnassignedPaints').toggle();
            }, SFI_DEFAULT_SHOW_UNASSIGNED_PAINTS_CARD);
            if (SFI_DEFAULT_SHOW_UNASSIGNED_PAINTS_CARD == false) {
                $('.skUnassignedPaints').toggle();
            }
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


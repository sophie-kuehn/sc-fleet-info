$(function () {
    'use strict';
    let ships = [];
    let skins = {};
    let upgrades = {};

    const INSURANCE_TYPE_LTI = 'lti';
    const INSURANCE_TYPE_IAE = 'iae';
    const INSURANCE_TYPE_MONTHLY = 'monthly';

    const manufacturerShortMap = {
        'ANVL': ['Anvil Aerospace', 'Anvil'],
        'AEGS': ['Aegis Dynamics', 'Aegis'],
        'AOPOA': ['Aopoa'],
        'ARGO': ['ARGO Astronautics', 'ARGO'],
        'BANU': ['Banu'],
        'CNOU': ['Consolidated Outland', 'Consolidated', 'C.O.'],
        'CRSD': ['Crusader Industries', 'Crusader'],
        'DRAK': ['Drake Interplanetary', 'Drake'],
        'ESPERIA': ['Esperia'],
        'ESPR': ['Esperia'],
        'GRIN': ['Greycat Industrial', 'Greycat'],
        'KRGR': ['Kruger Intergalactic', 'Kruger'],
        'MISC': ['MISC', 'Musashi Industrial & Starflight Concern', 'M.I.S.C.'],
        'ORIG': ['Origin Jumpworks', 'Origin Jumpworks GmbH', 'Origin'],
        'RSI': ['Roberts Space Industries', 'RSI', 'R.S.I.'],
        'TMBL': ['Tumbril'],
        'VANDUUL': ['Vanduul'],
        'XIAN': ['Xi\'an'],
    };

    const altShipNames = {
        'Mercury Star Runner': ['Star Runner'],
        'GRIN ROC DS': ['ROC'],
        '100i': ['100 series'],
        '125a': ['100 series'],
        '135c': ['100 series']
    };

    const doStrictSkinSearch = {
        'Sabre Raven': true,
        'Hull D': true
    };

    const prepareShipInfo = function(
        pledgeName, 
        pledgeNumber,
        name, 
        model, 
        manufacturer, 
        insuranceType, 
        insuranceDuration, 
        gamePackage, 
        image
    ) {
        let ship = {
            pledgeName: pledgeName,
            pledgeNumber: pledgeNumber,
            insuranceType: insuranceType,
            insuranceDuration: insuranceDuration,
            image: image,
            gamePackage: gamePackage,
            name: name,
            manufacturerNames: manufacturerShortMap[manufacturer] || [manufacturer]
        };

        $.each(ship.manufacturerNames, function(mi, manufacturerName) {
            model = model.replace(new RegExp(manufacturerName, 'gi'), '');
        });

        model = model.replace(/\-/gi, '').trim();
        ship.model = model;
        ship.shortModel = model.split(' ')[0];
        ship.altModelNames = altShipNames[ship.model] || []

        return ship;
    };

    let pledgeNumber = 0;
    const processPledges = function(body) 
    {
        $('.list-items li', body).each((index, el) => {
            pledgeNumber++;
            const $pledge = $(el);

            let gamePackage = false;
            let insurances = {};

            $pledge.find('.without-images .item .title').each((i, elBonus) => {
                let bonus = $(elBonus).text().trim();

                if (/Star\sCitizen\sDigital\sDownload/i.test(bonus)) {
                    gamePackage = true;

                } else if (/Lifetime\s+Insurance/i.test(bonus)) {
                    insurances.lti = true;

                } else if (/IAE\s+Insurance/i.test(bonus)) {
                    insurances.iae = true;

                } else {
                    let insuranceRegexResult = /(\d+)(\s+|-)Months?\s+Insurance/i.exec(bonus);
                    if (insuranceRegexResult !== null && insuranceRegexResult[1]) {
                        let duration = parseInt(insuranceRegexResult[1]);
                        if (duration > 0) insurances.monthly = duration;
                    }
                }
            });

            let insuranceType = null;
            let insuranceDuration = null;

            if (insurances.lti != undefined) {
                insuranceType = INSURANCE_TYPE_LTI;
            }
            else if (insurances.iae != undefined) {
                insuranceType = INSURANCE_TYPE_IAE;
                insuranceDuration = 120;
            }
            else if (insurances.monthly != undefined) {
                insuranceType = INSURANCE_TYPE_MONTHLY;
                insuranceDuration = insurances.monthly;
            }

            // browse the ships that are in "Also contains" part
            $pledge.find('.without-images .item .title').each((i, elBonus) => {
                const bonus = $(elBonus).text().trim();

                if (/Origin\s+G12[ar]/i.test(bonus)) {
                    const shipInfoRegexResult = /(Origin)\s+(G12[ar])/i.exec(bonus);
                    ships.push(prepareShipInfo(
                        $('.js-pledge-name', $pledge).val(),
                        pledgeNumber,
                        '',
                        shipInfoRegexResult[2],
                        shipInfoRegexResult[1],
                        insuranceType,
                        insuranceDuration,
                        gamePackage,
                        $('div.image', $pledge).css('background-image')
                    ));
                }
            });

            // browse the Ship items
            $('.items .item', $pledge).each((indexItem, elItem) => {
                const $item = $(elItem);

                let itemImage = $('div.image', $pledge).css('background-image');
                if ($item.find('.image').length !== 0) {
                    itemImage = $('.image', $item).css('background-image');
                }
                    
                // skins
                if ($item.find('.kind:contains(Skin)').length !== 0 
                    || $item.find('.title:contains(Paint)').length !== 0
                ) {
                    let skinTitle = $('.title', $item).text();
                    
                    if (skins[skinTitle] == undefined) {
                        skins[skinTitle] = {
                            title: skinTitle,
                            pledgeNumber: pledgeNumber,
                            image: itemImage,
                            count: 1,
                            attached: false
                        };
                    } else {
                        skins[skinTitle].count++;
                    }
                    
                    console.log(skins[skinTitle]);
                    return;
                }
                
                // upgrades
                if ($item.find('.title:contains(Upgrade -)').length !== 0
                    && $item.find('.title:contains( to )').length !== 0
                ) {
                    let upgradeTitle = $('.title', $item).text();
                    upgradeTitle = upgradeTitle.replace("Standard Edition", "");
                    upgradeTitle = upgradeTitle.trim();
                    let parts = upgradeTitle.split('-')[1].split(' to ')
                    
                    if (upgrades[upgradeTitle] == undefined) {
                        upgrades[upgradeTitle] = {
                            title: upgradeTitle,
                            pledgeNumber: pledgeNumber,
                            from: parts[0].trim(),
                            to: parts[1].trim(),
                            image: itemImage,
                            count: 1,
                            attached: false
                        };
                    } else {
                        upgrades[upgradeTitle].count++;
                    }
                    
                    console.log(upgrades[upgradeTitle])
                    return;
                }

                // special cases
                if ($item.find('.kind:contains(Hangar decoration)').length !== 0) {
                    if ($('.liner', $item).text().indexOf('Greycat Industrial') !== -1
                        && $('.title', $item).text().indexOf('Greycat PTV') !== -1) {

                        // Found the ship "Greycat PTV" from "Greycat Industrial"
                        ships.push(prepareShipInfo(
                            $('.js-pledge-name', $pledge).val(),
                            pledgeNumber,
                            '',
                            $('.title', $item).text(),
                            $('.liner span', $item).text(),
                            insuranceType,
                            insuranceDuration,
                            gamePackage,
                            itemImage
                        ));
                    }
                    return;
                }

                // ship
                if ($item.find('.kind:contains(Ship)').length !== 0) {
                    ships.push(prepareShipInfo(
                        $pledge,
                        pledgeNumber,
                        $('.custom-name', $item).text(),
                        $('.title', $item).text(),
                        $('.liner span', $item).text(),
                        insuranceType,
                        insuranceDuration,
                        gamePackage,
                        itemImage
                    ));
                }
            });
        })
    };
    
    const isShipInString = function(haystack, pledge)
    {
        let searchFor = pledge.shortModel;
        if (doStrictSkinSearch[pledge.model] != undefined) searchFor = pledge.model;
        let result = (haystack.search(new RegExp(searchFor, "i")) != -1);

        // take care of naming mess
        $.each(pledge.altModelNames, function(ani, altName) {
            if (haystack.search(new RegExp(altName, "i")) != -1) {
                result = true;
                return false;
            }
        });

        // even bigger mess
        if ((result == true && haystack.search(new RegExp("Ares Radiance", "i")) != -1
                && pledge.pledgeName.search(new RegExp("Radiance", "i")) == -1
            )
            || (result == true && haystack.search(new RegExp("Ares Ember", "i")) != -1
                && pledge.pledgeName.search(new RegExp("Ember", "i")) == -1
            )
        ) {
            result = false;
        }
        
        return result;
    };
    
    const htmlTemplates = {};
    
    htmlTemplates.link = $('<a></a>');
    htmlTemplates.link.css('color', 'rgb(189, 206, 212)');
    htmlTemplates.link.attr('target', '_blank');
    
    htmlTemplates.shipList = $('<div class="fleetList"></div>');
    htmlTemplates.shipList.css('display', 'flex');
    htmlTemplates.shipList.css('flex-wrap', 'wrap');
    htmlTemplates.shipList.css('color', '#bdced4');
    htmlTemplates.shipList.css('font-size', '0.8em');
        
    htmlTemplates.shipBox = $('<div></div>');
    htmlTemplates.shipBox.css('width', '25%');
    htmlTemplates.shipBox.css('position', 'relative');
        
    htmlTemplates.shipBox = $('<div></div>');
    htmlTemplates.shipBox.css('width', '25%');
    htmlTemplates.shipBox.css('position', 'relative');
        
    htmlTemplates.shipBoxInner = $('<div></div>');
    htmlTemplates.shipBoxInner.css('background-color', 'rgba(23,29,37,0.5)');
    htmlTemplates.shipBoxInner.css('padding', '10px');
    htmlTemplates.shipBoxInner.css('margin', '5px');

    htmlTemplates.imageBox = $('<div></div>');
    htmlTemplates.imageBox.css('background-size', 'cover');
    htmlTemplates.imageBox.css('background-position', 'center');
    htmlTemplates.imageBox.css('background-repeat', 'no-repeat');
    htmlTemplates.imageBox.css('height', '110px');
             
    htmlTemplates.infoBox = $('<ul></ul>');
    htmlTemplates.infoBox.css('margin', '0');
    htmlTemplates.infoBox.css('padding', '0'); 
  
    htmlTemplates.infoLine = $('<li></li>');
    htmlTemplates.infoLine.css('border-top', '1px solid rgb(29, 45, 66)');
    htmlTemplates.infoLine.css('padding', '3px 0');
    htmlTemplates.infoLine.css("position", "relative");
    
    htmlTemplates.infoLineOverlay = $('<div></div>');
    htmlTemplates.infoLineOverlay.css("position", "absolute");
    htmlTemplates.infoLineOverlay.css("right", "105%");
    htmlTemplates.infoLineOverlay.css("top", "0");
    htmlTemplates.infoLineOverlay.css("padding", "3px");
    htmlTemplates.infoLineOverlay.css("border", "3px solid rgb(29, 45, 66)");
    htmlTemplates.infoLineOverlay.css("background-color", "rgba(23, 29, 37, 0.5)");
    htmlTemplates.infoLineOverlay.css('background-size', 'cover');
    htmlTemplates.infoLineOverlay.css('background-position', 'center');
    htmlTemplates.infoLineOverlay.css('background-repeat', 'no-repeat');
    htmlTemplates.infoLineOverlay.css("display", "none");
    htmlTemplates.infoLineOverlay.css("z-index", "999");
    
    htmlTemplates.nameBox = htmlTemplates.infoLine.clone();
    htmlTemplates.nameBox.css('border-top', 'none');
    htmlTemplates.nameBox.css('padding', '3px 0 0 0');
    htmlTemplates.nameBox.css('font-size', '1.2em');
    htmlTemplates.nameBox.css('color', '#fff');
    
    htmlTemplates.modelBox = htmlTemplates.infoLine.clone();
    htmlTemplates.modelBox.css('border-top', 'none');
    htmlTemplates.modelBox.css('padding', '3px 0 0 0');
    htmlTemplates.modelBox.css("position", "relative");
    
    htmlTemplates.modelBoxBelowName = htmlTemplates.modelBox.clone();
    htmlTemplates.modelBoxBelowName.css('font-size', '0.9em');
    
    htmlTemplates.modelBoxStandAlone = htmlTemplates.modelBox.clone();
    htmlTemplates.modelBoxStandAlone.css('padding', '3px 0 0 0');
    htmlTemplates.modelBoxStandAlone.css('font-size', '1.2em');
    
    htmlTemplates.modelBoxIcons = $('<ul></ul>');
    htmlTemplates.modelBoxIcons.css("position", "absolute");
    htmlTemplates.modelBoxIcons.css("right", "0");
    htmlTemplates.modelBoxIcons.css("top", "0");
    
    htmlTemplates.manufacturerBox = htmlTemplates.infoLine.clone();
    htmlTemplates.manufacturerBox.css('border-top', 'none');
    htmlTemplates.manufacturerBox.css('border-bottom', '3px solid rgb(29, 45, 66)');
    htmlTemplates.manufacturerBox.css('padding', '0 0 6px 0');
    htmlTemplates.manufacturerBox.css('font-size', '0.8em');
        
    const getPledgeLink = function(pledgeNumber)
    {
        return 'https://robertsspaceindustries.com/account/pledges?page=' + pledgeNumber + '&pagesize=1';
    }
        
    const prepareLink = function(content, href)
    {
        let link = htmlTemplates.link.clone();
        link.attr('href', href);
        link.append(content);
        return link;
    }
    
    const renderShip = function(ship, infos)
    {
        let inner = htmlTemplates.shipBoxInner.clone();

        // image
        if (ship.image != undefined) {
            let imageBox = htmlTemplates.imageBox.clone();
            imageBox.css('background-image', ship.image);
            inner.append(imageBox);
        }
        
        // infos below image
        let infoBox = htmlTemplates.infoBox.clone();
        inner.append(infoBox);
             
        // individual ship name + model name
        let modelBox;
        if (ship.name != undefined 
            && ship.name.length > 0
        ) {
            let nameBox = htmlTemplates.nameBox.clone();
            nameBox.text(ship.name);
            infoBox.append(nameBox);
            
            modelBox = htmlTemplates.modelBoxBelowName.clone();
        } else {
            modelBox = htmlTemplates.modelBoxStandAlone.clone();
        }

        modelBox.append(prepareLink(
            ship.model,
            getPledgeLink(ship.pledgeNumber)
        ));
        infoBox.append(modelBox);
        
        // icons on the right of ship model name
        let icons = htmlTemplates.modelBoxIcons.clone();
        modelBox.append(icons);
        
        let fyLink = $('<li></li>')
        fyLink.append(prepareLink(
            $('<img title="FleetYards" width="15"  src="https://fleetyards.net/packs/media/images/favicon-small-76fc2169b09909bd82901f49ca7ab702.png" />'),
            'https://fleetyards.net/ships/' + ship.model.replace(/ /g, "-").toLowerCase() + '/'
        ));
        icons.append(fyLink);
               
        // manufacturer
        let manuBox = htmlTemplates.manufacturerBox.clone();        
        if (ship.manufacturerNames != undefined 
            && ship.manufacturerNames.length >= 1
        ) manuBox.text(ship.manufacturerNames[0]);
        infoBox.append(manuBox)

        // additional lines of info
        $.each(infos, function(iterator, info) {
            let infoLine = htmlTemplates.infoLine.clone();
            
            if (info.link != undefined && info.link.length > 0) {
                infoLine.append(prepareLink(info.text, info.link));
            } else {
                infoLine.text(info.text);
            }
            
            if (info.image != undefined && info.image.length > 0) {
                let overlay = htmlTemplates.infoLineOverlay.clone();     
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

        let shipBox = htmlTemplates.shipBox.clone();
        shipBox.append(inner);
        return shipBox;
    };
    
    const renderFleet = function(fleetList, fleetViewLink) 
    {
        fleetList.empty();
        let fleetViewLinkHref = "http://www.starship42.com/fleetview/?type=matrix";

        $.each(ships, function(index, ship) {
            console.log(ship);
            fleetViewLinkHref = fleetViewLinkHref + "&s[]=" + ship.model;
            let infos = [];
            
            if (ship.gamePackage) {
                infos.push({text:"Game Package"});
            }

            if (ship.insuranceType == INSURANCE_TYPE_LTI) {
                infos.push({text:"Life Time Insurance"});
            } else if (ship.insuranceType != null) {
                infos.push({text:ship.insuranceDuration + " Month/s Insurance"});
            }
            
            $.each(upgrades, function(iterator, upgrade) {
                if (!isShipInString(upgrade.from, ship)) return;
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
                if (!isShipInString(skin.title, ship)) return;
                skin.attached = true;
                    
                let skinName = skin.title;
                skinName = skinName.replace(ship.shortModel, "");
                skinName = skinName.replace(ship.model, "");
                $.each(ship.altModelNames, function(ani, altName) {
                    skinName = skinName.replace(new RegExp(altName, "i"), "");
                });
                $.each(ship.manufacturerNames, function(mi, manufacturerName) {
                    skinName = skinName.replace(new RegExp(manufacturerName, "i"), "");
                });
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
            
            if (missingUpgradeShips[upgrade.from] == undefined) {
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
        
        fleetViewLink.attr("href", fleetViewLinkHref);
    };

    let dataLoaded = false;
    const loadData = function(page, callback) 
    {
        if (dataLoaded) return callback();

        const url = '/account/pledges?pagesize=20&page=' + page;
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

    const renderFleetPage = function() 
    {
        $('div.sidenav ul li').removeClass('active');
        $('.showFleetsButton').addClass('active');
        let top = $('<div class="top"></div>');

        let fleetViewLinkBox = $('<div></div>');
        $('.inner-content').append(fleetViewLinkBox);
        let fleetViewLink = $('<a href="" target="_blank" class="shadow-button trans-02s trans-color" style="padding:0;float:right;"><span class="label js-label trans-02s">show my fleet in 3D</span><span class="left-section"></span><span class="right-section"></span></a>');
        top.append(fleetViewLink);

        $('.inner-content').empty().css('box-sizing', 'inherit').append(top);
        let title = $('<h2 class="title">MY FLEET</h2>');
        top.append(title);

        let sep = $('<div style="clear:both" class="separator"></div>');
        top.append(sep);

        let fleetList = htmlTemplates.shipList.clone();
        $('.inner-content').append(fleetList);

        loadData(1, function(){
            renderFleet(fleetList, fleetViewLink);
        });
    };
    
    let nav = $('div.sidenav ul li');
    if (nav.length > 0) {
        let newNav = $(nav[0]).clone();
        newNav.removeClass('active');
        newNav.addClass('showFleetsButton');
        newNav.find('.bg').text('MY FLEET');
        newNav.find('a').attr('href', 'javascript:void(0)');
        newNav.find('a').click(renderFleetPage);
        $('div.sidenav ul').prepend(newNav);
    }
});

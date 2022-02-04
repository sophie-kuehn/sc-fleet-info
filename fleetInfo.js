$(function () {
    'use strict';
    let ships = [];
    let skins = {};
    let upgrades = {};

    const INSURANCE_TYPE_LTI = 'lti';
    const INSURANCE_TYPE_IAE = 'iae';
    const INSURANCE_TYPE_MONTHLY = 'monthly';

    const _manufacturerShortMap = {
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

    const _altShipNames = {
        'Mercury Star Runner': ['Star Runner'],
        'GRIN ROC DS': ['ROC'],
        '100i': ['100 series'],
        '125a': ['100 series'],
        '135c': ['100 series']
    };

    const _doStrictSkinSearch = {
        'Sabre Raven': true,
        'Hull D': true
    };

    const prepareShipInfo = function($pledge, name, model, manufacturer, insuranceType, insuranceDuration, gamePackage, image)
    {
        if (image == undefined) {
            image = $('div.image', $pledge).css('background-image');
        }

        let pledge = {
            id: $('.js-pledge-id', $pledge).val(),
            insurance_type: insuranceType,
            insurance_duration: insuranceDuration,
            package_id: $('.js-pledge-id', $pledge).val(),
            pledge: $('.js-pledge-name', $pledge).val(),
            image: image,
            gamePackage: gamePackage,
            name: name,
            manufacturerNames: _manufacturerShortMap[manufacturer] || [manufacturer]
        };

        $.each(pledge.manufacturerNames, function(mi, manufacturerName) {
            model = model.replace(new RegExp(manufacturerName, 'gi'), '');
        });

        model = model.replace(/\-/gi, '').trim();
        pledge.model = model;
        pledge.shortModel = model.split(' ')[0];
        pledge.altModelNames = _altShipNames[pledge.model] || []

        return pledge;
    };

    const processPledges = function(body) 
    {
        $('.list-items li', body).each((index, el) => {
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
                        $pledge,
                        '',
                        shipInfoRegexResult[2],
                        shipInfoRegexResult[1],
                        insuranceType,
                        insuranceDuration,
                        gamePackage
                    ));
                }
            });

            // browse the Ship items
            $('.items .item', $pledge).each((indexItem, elItem) => {
                const $item = $(elItem);

                let itemImage = "";
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
                            $pledge,
                            '',
                            $('.title', $item).text(),
                            $('.liner span', $item).text(),
                            insuranceType,
                            insuranceDuration,
                            gamePackage
                        ));
                    }
                    return;
                }

                // ship
                if ($item.find('.kind:contains(Ship)').length !== 0) {
                    ships.push(prepareShipInfo(
                        $pledge,
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
        if (_doStrictSkinSearch[pledge.model] != undefined) searchFor = pledge.model;
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
                && pledge.pledge.search(new RegExp("Radiance", "i")) == -1
            )
            || (result == true && haystack.search(new RegExp("Ares Ember", "i")) != -1
                && pledge.pledge.search(new RegExp("Ember", "i")) == -1
            )
        ) {
            result = false;
        }
        
        return result;
    };
    
    const renderShip = function(ship, infos)
    {
        let inner = $('<div></div>');
        inner.css('background-color', 'rgba(23,29,37,0.5)');
        inner.css('padding', '10px');
        inner.css('margin', '5px');

        if (ship.image != undefined) {
            let imageBox = $('<div></div>');
            imageBox.css('background-image', ship.image);
            imageBox.css('background-size', 'cover');
            imageBox.css('background-position', 'center');
            imageBox.css('background-repeat', 'no-repeat');
            imageBox.css('height', '110px');
            inner.append(imageBox);
        }
        
        let infoBox = $('<ul></ul>');
        infoBox.css('margin', '0');
        infoBox.css('padding', '0'); 
        inner.append(infoBox);
        
        let infoTemplate = $('<li></li>');
        infoTemplate.css('border-top', '1px solid rgb(29, 45, 66)');
        infoTemplate.css('padding', '3px 0');
        infoTemplate.css("position", "relative");
        
        let infoOverlayTemplate = $('<div></div>');
        infoOverlayTemplate.css("position", "absolute");
        infoOverlayTemplate.css("right", "105%");
        infoOverlayTemplate.css("top", "0");
        infoOverlayTemplate.css("padding", "3px");
        infoOverlayTemplate.css("border", "3px solid rgb(29, 45, 66)");
        infoOverlayTemplate.css("background-color", "rgba(23, 29, 37, 0.5)");
        infoOverlayTemplate.css('background-size', 'cover');
        infoOverlayTemplate.css('background-position', 'center');
        infoOverlayTemplate.css('background-repeat', 'no-repeat');
        infoOverlayTemplate.css("display", "none");
        infoOverlayTemplate.css("z-index", "999");
            
        let modelBox = infoTemplate.clone();
        modelBox.css('border-top', 'none');
        modelBox.css('padding', '3px 0 0 0');
        modelBox.css('color', '#fff');
        modelBox.text(ship.model);
        
        if (ship.name != undefined 
            && ship.name.length > 0
        ) {
            let nameBox = infoTemplate.clone();
            nameBox.css('border-top', 'none');
            nameBox.css('padding', '3px 0 0 0');
            nameBox.css('font-size', '1.2em');
            nameBox.css('color', '#fff');
            nameBox.text(ship.name);
            infoBox.append(nameBox);
            
            modelBox.css('font-size', '0.9em');
            
        } else {
            modelBox.css('padding', '3px 0 0 0');
            modelBox.css('font-size', '1.2em');
        }

        infoBox.append(modelBox);

        let manuBox = infoTemplate.clone();
        manuBox.css('border-top', 'none');
        manuBox.css('border-bottom', '3px solid rgb(29, 45, 66)');
        manuBox.css('padding', '0 0 6px 0');
        manuBox.css('font-size', '0.8em');
        
        if (ship.manufacturerNames != undefined 
            && ship.manufacturerNames.length >= 1
        ) {
            manuBox.text(ship.manufacturerNames[0]);
        }        
        
        infoBox.append(manuBox)

        $.each(infos, function(iterator, info) {
            let infoLine = infoTemplate.clone();
            infoLine.text(info.text);
            
            if (info.image != undefined
                && info.image.length > 0
            ) {
                let overlay = infoOverlayTemplate.clone();     
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

        let newEntry = $('<div></div>');
        newEntry.css('width', '25%');
        newEntry.css('position', 'relative');
        newEntry.append(inner);
        
        return newEntry;
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

            if (ship.insurance_type == INSURANCE_TYPE_LTI) {
                infos.push({text:"Life Time Insurance"});
            } else if (ship.insurance_type != null) {
                infos.push({text:ship.insurance_duration + " Month/s Insurance"});
            }
            
            $.each(upgrades, function(iterator, upgrade) {
                if (!isShipInString(upgrade.from, ship)) return;
                upgrade.attached = true;
                let text = "Upgrade to " + upgrade.to;
                if (upgrade.count > 1) text = text + " (" + upgrade.count + ")";
                infos.push({text:text, image:upgrade.image});
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
                infos.push({text:skinName, image:skin.image});
            });
            
            fleetList.append(renderShip(ship, infos));
        });
        
        let missingUpgradeShips = {};

        $.each(upgrades, function(iterator, upgrade) {
            if (upgrade.attached) return;
            let text = "Upgrade to " + upgrade.to;
            if (upgrade.count > 1) text = text + " (" + upgrade.count + ")";
            let info = {text:text, image:upgrade.image};
            
            if (missingUpgradeShips[upgrade.from] == undefined) {
                missingUpgradeShips[upgrade.from] = {
                    shipName: upgrade.from,
                    upgrades: [info]
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

        const url = '/account/pledges?page=' + page;
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

        let fleetList = $('<div class="fleetList"></div>');
        fleetList.css('display', 'flex');
        fleetList.css('flex-wrap', 'wrap');
        fleetList.css('color', '#bdced4');
        fleetList.css('font-size', '0.8em');
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

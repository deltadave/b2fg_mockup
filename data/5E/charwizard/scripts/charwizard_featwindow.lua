-- 
-- Please see the license.html file included with this distribution for 
-- attribution and copyright information.
--

function onInit()
	createFeatLabels();
end

function createFeatWindow()
	createWindow();
end

function createFeatLabels()
	local wndSummary = Interface.findWindow("charwizard", "");	
	local aFeats = {};
	local aDBClasses = {};
	local sRaceFeatRecord = ""
	local sRaceFeatName = ""
	if CampaignRegistry.charwizard.import then
		for _,vClass in pairs(DB.getChildren(DB.findNode(wndSummary.summary.subwindow.summary_identity.getValue()), "classes")) do
			aDBClasses[DB.getValue(vClass, "name", "")] = tonumber(DB.getValue(vClass, "level", ""));
		end
	end
	if not CampaignRegistry.charwizard.import and (CampaignRegistry.charwizard.feats and CampaignRegistry.charwizard.feats.race) then
		if CampaignRegistry.charwizard.race.name ~= "human-variant" and CampaignRegistry.charwizard.race.name ~= "custom lineage" then
			for _,vFeatWindow in pairs(getWindows()) do
				if tonumber(vFeatWindow.group_number.getValue()) < 1 then
					vFeatWindow.close();
					if CampaignRegistry.charwizard.feats.racebonus then
						CampaignRegistry.charwizard.feats.racebonus.bonus = 0;
					end	
				end
			end
		elseif (CampaignRegistry.charwizard.race.name == "human-variant" or CampaignRegistry.charwizard.race.name == "custom lineage") and CampaignRegistry.charwizard.feats.race == "" then
			table.insert(aFeats, {name = "SELECT RACIAL FEAT", order = 0, class = ""});
		end
	end
	if CampaignRegistry.charwizard.feats and CampaignRegistry.charwizard.feats.class then
		if #CampaignRegistry.charwizard.feats.class == 0 then
			for _,vClassFeatWindow in pairs(getWindows()) do
				if tonumber(vClassFeatWindow.group_number.getValue()) >= 1 then
					vClassFeatWindow.close();
				end
			end
		end
		for _,vClassFeats in pairs(CampaignRegistry.charwizard.feats.class) do
			if CampaignRegistry.charwizard.import then
				for kClass,vLevel in pairs(aDBClasses) do
					if string.lower(kClass) == string.lower(vClassFeats.name) and vClassFeats.level > vLevel then 
						if vClassFeats.asi or vClassFeats.feat then
							if vClassFeats.feat ~= "" then
							elseif #vClassFeats.asi > 0 then
							else
								vClassFeats.asi = {};
								vClassFeats.feat = "";
								vClassFeats.record = "";
								vClassFeats.classbonus = {};
								table.insert(aFeats, {name = "SELECT " .. vClassFeats.name .. " LEVEL " .. vClassFeats.level .. " FEAT", order = vClassFeats.level / 4, class = vClassFeats.name, level = vClassFeats.level});
							end
						else
							table.insert(aFeats, {name = "SELECT " .. vClassFeats.name .. " LEVEL " .. vClassFeats.level .. " FEAT", order = vClassFeats.level / 4, class = vClassFeats.name, level = vClassFeats.level});
						end
					end
				end
			else
				if vClassFeats.asi or vClassFeats.feat then
					if vClassFeats.feat ~= "" then
					elseif #vClassFeats.asi > 0 then
					else
						vClassFeats.asi = {};
						vClassFeats.feat = "";
						vClassFeats.record = "";
						vClassFeats.classbonus = {};
						table.insert(aFeats, {name = "SELECT " .. vClassFeats.name .. " LEVEL " .. vClassFeats.level .. " FEAT", order = vClassFeats.level / 4, class = vClassFeats.name, level = vClassFeats.level});
					end
				else
					table.insert(aFeats, {name = "SELECT " .. vClassFeats.name .. " LEVEL " .. vClassFeats.level .. " FEAT", order = vClassFeats.level / 4, class = vClassFeats.name, level = vClassFeats.level});
				end
			end
		end
	end
	for k,vFeatList in pairs(aFeats) do
		local w = createWindow();
		if vFeatList.name == "SELECT RACIAL FEAT" then
			w.asi_button.setVisible(false);
		end
		w.group_name.setValue(vFeatList.name);
		w.group_name.setVisible(true);
		w.group_number.setValue(vFeatList.order);
		w.selection_type.setValue(vFeatList.class);
		applySort();
		createFeatList(vFeatList.order, w);
	end
	wndSummary.calcSummaryStats();
end	
	
function createASIList(sGroup, w)
	w.selection_window.closeAll();
	w.selection_window.setVisible(false);
	for i=1,#DataCommon.abilities do
		local wndSubwindow = w.selection_window.createWindow();
		wndSubwindow.name.setValue(DataCommon.abilities[i]);
		wndSubwindow.bname.setText(StringManager.capitalize(DataCommon.abilities[i]));
	end
	w.selection_window.setVisible(true);	
end

function clearFeat(sFeatGroup)
	local wndSummary = Interface.findWindow("charwizard", "");
	local nFeatLevel = tonumber(sFeatGroup:match("(%d+)"));
	local sFeatClass = (sFeatGroup:match("SELECT (%w+)"));
	for _,vCRFeatNodes in pairs(CampaignRegistry.charwizard.feats.class) do
		if vCRFeatNodes.name == sFeatClass and vCRFeatNodes.level == nFeatLevel then
			vCRFeatNodes.feat = "";
			vCRFeatNodes.record = "";
		end
	end
end

function clearASI(sASIName)
	local wndSummary = Interface.findWindow("charwizard", "");
	local nASILevel = tonumber(sASIName:match("(%d+)"));
	local sASIClass = (sASIName:match("SELECT (%w+)"));
	if wndSummary.genstats and wndSummary.genstats.subwindow then
		for _,vStatASIWindow in pairs(wndSummary.genstats.subwindow.contents.subwindow.abilityscore_improvements.getWindows()) do
			if vStatASIWindow.abilityimp_lvl.getValue() == nASILevel and vStatASIWindow.class.getValue() == sASIClass then
				for i=1,6 do
					vStatASIWindow["abilityimp_" .. string.lower(DataCommon.ability_ltos[DataCommon.abilities[i]])].setValue(0);
				end
			end
		end
	end
	for _,vCRFeatNodes in pairs(CampaignRegistry.charwizard.feats.class) do
		if vCRFeatNodes.name == sASIClass and vCRFeatNodes.level == nASILevel then
			vCRFeatNodes.asi = {};
		end
	end
end

function setASI(w, sASIName, sAbility)
	w.window.selection_shortcut.setVisible(false);	
	local wndSummary = Interface.findWindow("charwizard", "");
	local aASIAbilities = {};
	local nASIBonus = 1;
	local nASILevel = tonumber(sASIName:match("(%d+)"));
	local sASIClass = (sASIName:match("SELECT (%w+)"));
	clearFeat(sASIName);
	for _,vASIWindow in pairs(w.getWindows()) do
		if w.window.group_name.getValue() == sASIName then
			if vASIWindow.value.getValue() == "1" then
				table.insert(aASIAbilities, vASIWindow.name.getValue());
			end
		end
	end
	if #aASIAbilities == 1 then
		nASIBonus = 2;
	end
	if wndSummary.genstats and wndSummary.genstats.subwindow then
		for _,vStatASIWindow in pairs(wndSummary.genstats.subwindow.contents.subwindow.abilityscore_improvements.getWindows()) do
			if vStatASIWindow.abilityimp_lvl.getValue() == nASILevel and vStatASIWindow.class.getValue() == sASIClass then
				--clearASI(sASIName);
				for _,vAbilityShort in pairs(aASIAbilities) do
					vStatASIWindow["abilityimp_" .. string.lower(DataCommon.ability_ltos[vAbilityShort])].setValue(nASIBonus);
				end
			end
		end
	end
	local aASIAbilityVars = {};
	for _,vAbility in pairs(aASIAbilities) do
		table.insert(aASIAbilityVars, {name = "n" .. DataCommon.ability_ltos[string.lower(vAbility)], value = nASIBonus});
	end
	for _,vCRFeatNodes in pairs(CampaignRegistry.charwizard.feats.class) do
		if vCRFeatNodes.name == sASIClass and vCRFeatNodes.level == nASILevel then
			vCRFeatNodes.asi = aASIAbilityVars;
		end
	end
	w.window.selection_shortcut.setVisible(false);
	if aASIAbilities and #aASIAbilities == 1 then
		w.window.selection_name.setValue(string.upper(aASIAbilities[1]));
	elseif aASIAbilities and #aASIAbilities == 2 then
		w.window.selection_name.setValue(string.upper(aASIAbilities[1]) .. ", " .. string.upper(aASIAbilities[2]));
	end
	wndSummary.calcSummaryStats()
	local bAlert = true;
	for _,vAlertCheck in pairs(getWindows()) do
		if vAlertCheck.selection_name == "" then
			bAlert = false;
		end
	end
	if bAlert then
		wndSummary.feat_alert.setVisible(false);
	end	
end
	
function createFeatList(sGroup, w)
	w.selection_window.closeAll();
	w.selection_window.setVisible(false);

	local aFeatCheck = {};	
	local aMappings = LibraryData.getMappings("feat");
	for _,vMapping in ipairs(aMappings) do
		for _,vFeat in pairs(DB.getChildrenGlobal(vMapping)) do	
			local sFeatLower = StringManager.trim(DB.getValue(vFeat, "name", "")):lower();
			local sFeatLink = vFeat.getPath();
			if not StringManager.contains(aFeatCheck, sFeatLower) then
				table.insert(aFeatCheck, sFeatLower);
		
				local wndSubwindow = w.selection_window.createWindow();
				wndSubwindow.name.setValue(sFeatLower);
				local sFeatCapitalized = StringManager.capitalizeAll(sFeatLower);
				wndSubwindow.bname.setText(sFeatCapitalized);
				wndSubwindow.group_number.setValue(sGroup);				
				wndSubwindow.shortcut.setValue("reference_feat", sFeatLink);
			end
		end
	end
	applySort();
	w.selection_window.setVisible(true);	
end

function parseSelection(w, sSelectionGroup, sOrder, sSelectionParent, sSelectionType, sSelectionName, sSelectionClass, sSelectionRecord)
	local wndSummary = Interface.findWindow("charwizard", "");
	local nodeSource = DB.findNode(sSelectionRecord);
	local nFeatLevel = tonumber(sSelectionGroup:match("(%d+)"));
	local sFeatClass = (sSelectionGroup:match("SELECT (%w+)"));	
	if sSelectionGroup == "SELECT RACIAL FEAT" then
		for _,vFeatSelection in pairs(getWindows()) do
			if vFeatSelection.selection_type.getValue() == "selection" and tonumber(vFeatSelection.group_number.getValue()) == (tonumber(sOrder) + .1) then
				vFeatSelection.close();
			end
		end
		for _,vFeatWindow in pairs(getWindows()) do		
			if vFeatWindow.group_name.getValue() == "SELECT RACIAL FEAT" then
				vFeatWindow.selection_name.setValue(sSelectionName);
				vFeatWindow.selection_shortcut.setValue(sSelectionClass, sSelectionRecord);
				CampaignRegistry.charwizard.feats.race = sSelectionRecord;
				CampaignRegistry.charwizard.feats.racebonus = {};
				wndSummary.feat_alert.setVisible(false);
				setFeatBonus(sSelectionGroup, vFeatWindow.group_number.getValue(), sSelectionName, sSelectionClass, sSelectionRecord);
			end
		end
	elseif sSelectionType == "selection" then
		if sOrder == "0" then
			CampaignRegistry.charwizard.feats.racebonus = {ability = StringManager.capitalize(string.lower(sSelectionName)), bonus = 1};
			w.selection_name.setValue(sSelectionName); 
			w.selection_name.setVisible(true);
			wndSummary.calcSummaryStats();
		else
			local nAbilityLevel = tonumber(sSelectionParent:match("(%d+)"));
			local sAbilityClass = (sSelectionParent:match("SELECT (%w+)"));		
			if CampaignRegistry.charwizard.feats.class then
				for _,vCRFeat in pairs(CampaignRegistry.charwizard.feats.class) do
					if vCRFeat.name == sAbilityClass and vCRFeat.level == nAbilityLevel then
						vCRFeat.classbonus = {ability = StringManager.capitalize(string.lower(sSelectionName)), bonus = 1};
						w.selection_name.setValue(sSelectionName); 
						w.selection_name.setVisible(true);
						wndSummary.calcSummaryStats();				
					end
				end
			end
		end
		if CampaignRegistry.charwizard.feats.class then
			for _,vCRFeat in pairs(CampaignRegistry.charwizard.feats.class) do
				if vCRFeat.name == sFeatClass and vCRFeat.level == nFeatLevel then
					vCRFeat.feat = sSelectionName;
					vCRFeat.record = sSelectionRecord;
					clearASI(sSelectionGroup);
					vCRFeat.classbonus = {ability = string.lower(sSelectionName), bonus = 1};
					wndSummary.calcSummaryStats();
				end
			end
		end
	else
		for _,vFeatSelection in pairs(getWindows()) do
			if vFeatSelection.selection_type.getValue() == "selection" and tonumber(vFeatSelection.group_number.getValue()) == (tonumber(sOrder) + .1) then
				vFeatSelection.close();
			end
		end	
		for _,vFeatWindow in pairs(getWindows()) do		
			if vFeatWindow.group_name.getValue() == sSelectionGroup then
				for _,vCRFeat in pairs(CampaignRegistry.charwizard.feats.class) do
					if vCRFeat.name == sFeatClass and vCRFeat.level == nFeatLevel then
						vCRFeat.feat = sSelectionName;
						vCRFeat.record = sSelectionRecord;
						clearASI(sSelectionGroup);
						if vCRFeat.classbonus then
							vCRFeat.classbonus = {};
						end
						wndSummary.calcSummaryStats();
					end
				end
				vFeatWindow.selection_name.setValue(sSelectionName);
				vFeatWindow.selection_shortcut.setValue(sSelectionClass, sSelectionRecord);
				vFeatWindow.selection_shortcut.setVisible(true);
				setFeatBonus(sSelectionGroup, vFeatWindow.group_number.getValue(), sSelectionName, sSelectionClass, sSelectionRecord);
			end
		end
	end
	local bAlert = true;
	for _,vAlertCheck in pairs(getWindows()) do
		if vAlertCheck.selection_name == "" then
			bAlert = false;
		end
	end
	if bAlert then
		wndSummary.feat_alert.setVisible(false);
	end	
end

function setFeatBonus(sSelectionGroup, sOrder, sSelectionName, sSelectionClass, sSelectionRecord)
	local wndSummary = Interface.findWindow("charwizard", "");
	local nodeSource = DB.findNode(sSelectionRecord);
	local sFeatText = DB.getValue(nodeSource, "text", "");
	local nFeatLevel = tonumber(sSelectionGroup:match("(%d+)"));
	local sFeatClass = (sSelectionGroup:match("SELECT (%w+)"));	
	local sIncrease = "";
	CampaignRegistry.charwizard.feats = CampaignRegistry.charwizard.feats or {};
	local w1, w2, w3, w4;
	if string.match(sFeatText, "Increase your ") then
		w1, w2, w3, w4 = string.match(sFeatText, "[Ii]ncrease your (%w+), (%w+), (%w+), or (%w+) score by");
		if not w4 then
			w1, w2, w3 = string.match(sFeatText, "[Ii]ncrease your (%w+), (%w+), or (%w+) score by");
		end
		if not w3 then
			w1, w2 = string.match(sFeatText, "[Ii]ncrease your (%w+) or (%w+) score by");
		end
		if not w2 then
			w1 = string.match(sFeatText, "[Ii]ncrease your (%w+) score by");
			for _,vFeatWindow in pairs(getWindows()) do		
				if vFeatWindow.group_name.getValue() == "SELECT RACIAL FEAT" then
					CampaignRegistry.charwizard.feats.racebonus = {ability = w1, bonus = 1};
				else
					if vFeatWindow.group_name.getValue() == sSelectionGroup then
						for _,vCRFeat in pairs(CampaignRegistry.charwizard.feats.class) do
							if vCRFeat.name == sFeatClass and vCRFeat.level == nFeatLevel then
								vCRFeat.classbonus = {ability = w1, bonus = 1};							
							end
						end
					end
				end
			end
		else
			local wndFeatChoice = createWindow();
			wndFeatChoice.group_name.setValue(sSelectionName);
			wndFeatChoice.selection_shortcut.setValue(sSelectionClass, sSelectionRecord);
			wndFeatChoice.asi_button.setVisible(false);
			wndFeatChoice.group_number.setValue(tonumber(sOrder) + .1);
			wndFeatChoice.selection_type.setValue("selection");
			applySort();
			local aAbilityList = {};
			if w4 then
				aAbilityList[4] = w4;
			end
			if w3 then
				aAbilityList[3] = w3;
			end
			aAbilityList[2] = w2;
			aAbilityList[1] = w1;
			for i=1,#aAbilityList do
				local wndAbilityChoice = wndFeatChoice.selection_window.createWindow();
				wndAbilityChoice.bname.setText(aAbilityList[i]);
				wndAbilityChoice.name.setValue(string.lower(aAbilityList[i]));
				wndAbilityChoice.parent.setValue(sSelectionGroup);
				wndAbilityChoice.group_number.setValue(sOrder);
				wndAbilityChoice.windowlist.applySort(group_number);
			end
		end		
	end
	wndSummary.calcSummaryStats();
end

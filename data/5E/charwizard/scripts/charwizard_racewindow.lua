-- 
-- Please see the license.html file included with this distribution for 
-- attribution and copyright information.
--

function onInit()
	createRaceLabels();
end

function createRaceLabels()
	local w = createWindow();
	w.group_name.setValue("SELECT RACE");
	createRaceList(1, w);
	local wndSummary = Interface.findWindow("charwizard", "");
	getRaceAlerts(wndSummary);
end	
	
function createRaceList(sGroup, w)
	local aRaceCheck = {};	
	local aMappings = LibraryData.getMappings("race");
	for _,vMapping in ipairs(aMappings) do
		-- If it is a PHB Race, load it first
		for _,vPHBRace in pairs(DB.getChildrenGlobal(vMapping)) do	
			local sPHBRaceLower = StringManager.trim(DB.getValue(vPHBRace, "name", "")):lower();
			local sPHBRaceLink = vPHBRace.getPath();
			
			if string.match(sPHBRaceLink, "DD PHB Deluxe") then
				table.insert(aRaceCheck, sPHBRaceLower);
				local wndSubwindow = w.selection_window.createWindow();
				wndSubwindow.name.setValue(sPHBRaceLower);
				local sPHBRaceCapitalized = StringManager.capitalizeAll(sPHBRaceLower);
				wndSubwindow.bname.setText(sPHBRaceCapitalized);
				wndSubwindow.group.setValue(sGroup);
				wndSubwindow.shortcut.setValue("reference_race", sPHBRaceLink);
				applySort();				
			end
		end
		-- Load all other races ignoring their version of base races.
		for _,vRace in pairs(DB.getChildrenGlobal(vMapping)) do	
			local sRaceLower = StringManager.trim(DB.getValue(vRace, "name", "")):lower();
			local sRaceLink = vRace.getPath();
			if not StringManager.contains(aRaceCheck, sRaceLower) then
				local wndSubwindow = w.selection_window.createWindow();
				wndSubwindow.name.setValue(sRaceLower);
				local sRaceCapitalized = StringManager.capitalizeAll(sRaceLower);
				wndSubwindow.bname.setText(sRaceCapitalized);
				wndSubwindow.group.setValue(sGroup);				
				wndSubwindow.shortcut.setValue("reference_race", sRaceLink);
				applySort();				
			end
		end
	end
	applySort();
end

function createSubraceList(sRace, sRaceClass, sRaceRecord, w)
	local aSubraces = {};
	local aSubraceCheck = {};
	local aMappings = LibraryData.getMappings("race");
	for _,vMapping in ipairs(aMappings) do	
		for _,vRace in pairs(DB.getChildrenGlobal(vMapping)) do	
			local sRaceLower = StringManager.trim(DB.getValue(vRace, "name", "")):lower();
			for _,vSubrace in pairs(DB.getChildren(vRace, "subraces")) do
				local sSubraceLower = StringManager.trim(DB.getValue(vSubrace, "name", "")):lower();
				local sSubraceLink = vSubrace.getPath();
				if sRaceLower == (sRace):lower() then
					table.insert(aSubraces, sSubraceLower .. sSubraceLink);

					local wndSubrace = w.selection_window.createWindow();
					wndSubrace.name.setValue(sSubraceLower);
					local sSubraceCapitalized = StringManager.capitalizeAll(sSubraceLower);
					wndSubrace.bname.setText(sSubraceCapitalized);
					wndSubrace.shortcut.setValue("reference_subrace", sSubraceLink);
				end
			end
		end
	end
	applySort();
end

function createAbilities(w, aIncreases, sRace, sType, sRaceClass, sRaceRecord)
	local bApplied;
	w.selection_window.setColumnWidth(135);
	for _,vAbility in pairs(DataCommon.abilities) do
		if aIncreases then
			for vName,vScore in pairs(aIncreases) do
				if vAbility ~= vName then
					local wndAbility = w.selection_window.createWindowWithClass("race_sub_item");
					wndAbility.name.setValue(vAbility);
					wndAbility.value.setValue(vScore);
					wndAbility.type.setValue(sType);
					wndAbility.bname.setText(StringManager.capitalize(vAbility));
					bApplied = true;
				end
			end
		end
	end
	if not bApplied then	
		for _,vAbility in pairs(DataCommon.abilities) do
			local wndAbility = w.selection_window.createWindowWithClass("race_sub_item");
			wndAbility.name.setValue(vAbility);
			wndAbility.type.setValue(sType);			
			wndAbility.bname.setText(StringManager.capitalize(vAbility));
		end
	end
end

function createDragons(sTrait, w)
	local aDragons = {"Black", "Blue", "Brass", "Bronze", "Copper", "Gold", "Green", "Red", "Silver", "White"};
	w.selection_window.setColumnWidth(135);
	for _,vDragon in pairs(aDragons) do 
		local wndDragons = w.selection_window.createWindowWithClass("race_sub_item");
		wndDragons.bname.setText(StringManager.capitalize(vDragon));
		wndDragons.name.setValue(StringManager.capitalize(vDragon));
	end	
end

function createFeats(sTrait, w)
	local aFeatList = w.getFeats();
	for _,vFeats in pairs(aFeatList) do 
		local wndFeats = w.selection_window.createWindow();
		wndFeats.bname.setText(StringManager.capitalizeAll(vFeats));
		wndFeats.name.setValue(StringManager.capitalize(vFeats));
	end	
	applySort();
end

function createLanguages(sTrait, w, sType)
	local wndSummary = Interface.findWindow("charwizard", "");
	local aAvailableLanguages = {};
	local aAutoLanguages = {};
	local aLimitedLanguageChoice = {};
	local sText = DB.getText(sTrait, "text");
	local bLimited;
	local sLanguages = sText:match("You can speak, read, and write ([^.]+)");

	if not sLanguages then
		sLanguages = sText:match("You can read and write ([^.]+)");
	end

	if not sLanguages then
		sLanguages = sText:match("You speak, read, and write ([^.]+)");
	end

	if sText:match("and your choice of (%w+) or (%w+)") then
		local sLanguage1, sLanguage2 = sText:match("and your choice of (%w+) or (%w+)");
		table.insert(aLimitedLanguageChoice, sLanguage1)
		table.insert(aLimitedLanguageChoice, sLanguage2)		
		bLimited = true;
	end

	if not sLanguages then
		return false;
	end

	sLanguages = sLanguages:gsub(" ", "");

	for vAutoLanguage in string.gmatch(sLanguages, "([^,]+)") do
		table.insert(aAutoLanguages, vAutoLanguage);
	end
	for kLang,_ in pairs(GameSystem.languages) do
		if not StringManager.contains(aAutoLanguages, kLang) then
			table.insert(aAvailableLanguages, kLang);
		end	
	end
	w.selection_window.setColumnWidth(135);
	if bLimited then
		for _,vLanguage in pairs(aLimitedLanguageChoice) do 
			local wndLanguages = w.selection_window.createWindowWithClass("race_sub_item");
			wndLanguages.bname.setText(StringManager.capitalize(vLanguage));
			wndLanguages.name.setValue(StringManager.capitalize(vLanguage));
			wndLanguages.type.setValue(sType);
		end
	else
		for _,vLanguage in pairs(aAvailableLanguages) do 
			local wndLanguages = w.selection_window.createWindowWithClass("race_sub_item");
			wndLanguages.bname.setText(StringManager.capitalize(vLanguage));
			wndLanguages.name.setValue(StringManager.capitalize(vLanguage));
			wndLanguages.type.setValue(sType);
		end		
	end
end

function createSize()
	local aSize = {"Small", "Medium"};
	local wSize = createWindow();
	wSize.group_name.setValue("SELECT SIZE");
	wSize.group_number.setValue(2);
	wSize.selection_window.setColumnWidth(135);
	for _,vSelectSize in pairs(aSize) do 
		local wndSelectSize = wSize.selection_window.createWindowWithClass("race_sub_item");
		wndSelectSize.bname.setText(StringManager.capitalize(vSelectSize));
		wndSelectSize.name.setValue(StringManager.capitalize(vSelectSize));
	end	
end

function createSkills(sTrait, w, sType, aLimitedSkills)
	local sText = DB.getText(sTrait, "text");
	local sSkills = sText:match("choice");

	if not sSkills then
		return false;
	end	
	if aLimitedSkills[1] then
		for _,vSkill in pairs(aLimitedSkills) do 
			local wndSkills = w.selection_window.createWindow();
			wndSkills.bname.setText(StringManager.capitalizeAll(vSkill));
			wndSkills.name.setValue(StringManager.capitalizeAll(vSkill));
			wndSkills.type.setValue(sType);
			wndSkills.shortcut.setValue("ref_ability", "reference.skilldata." .. string.lower(vSkill) .. "@DD PHB Deluxe");
		end		
	else
		for kSkill,_ in pairs(DataCommon.skilldata) do 
			local wndSkills = w.selection_window.createWindow();
			wndSkills.bname.setText(StringManager.capitalizeAll(kSkill));
			wndSkills.name.setValue(StringManager.capitalizeAll(kSkill));
			wndSkills.type.setValue(sType);
			wndSkills.shortcut.setValue("ref_ability", "reference.skilldata." .. string.lower(kSkill) .. "@DD PHB Deluxe");			
		end
	end
end

function createSpells(v, w, sGroup, nLevel, sClass)
	w.selection_window.closeAll();
	local aMappings = LibraryData.getMappings("spell");
	for _,vMapping in ipairs(aMappings) do
		for _,vSpell in pairs(DB.getChildrenGlobal(vMapping)) do	
			local sSpellLower = "";
			local sSpellLevel = DB.getValue(vSpell, "level", "");
			local sSpellSource = DB.getValue(vSpell, "source", "");
			local aSpellSources = StringManager.split(sSpellSource, ",");	
			sSpellLower = StringManager.trim(DB.getValue(vSpell, "name", "")):lower();
			if tonumber(sSpellLevel) == nLevel then
				for i = 1,#aSpellSources do
					local sSourceName = string.gsub(aSpellSources[i], "^%s*", "");
					if string.lower(sSourceName) == sClass then
						local wndSpells = w.selection_window.createWindowWithClass("race_spell_item");
						wndSpells.bname.setText(StringManager.capitalizeAll(sSpellLower));
						wndSpells.name.setValue(sSpellLower);
						wndSpells.shortcut.setValue("reference_spell", vSpell.getPath());						
					end
				end
			end
		end
		applySort();
	end
end

function createTools(sTrait, w, wndSummary)
	local bAllTools = false;
	local sText = DB.getText(sTrait, "text");
	local sTools = sText:match("choice: ([^.]+)");
	if not sTools then
		if sText:match("of your choice.") then
			bAllTools = true;
		end
	end
	w.selection_window.setColumnWidth(135);
	if bAllTools then
		for _,vAllTool in pairs(wndSummary.getToolType()) do
			local wndTools = w.selection_window.createWindowWithClass("race_sub_item");
			wndTools.bname.setText(StringManager.capitalize(vAllTool));
			wndTools.name.setValue(StringManager.capitalize(vAllTool));		
		end
	else
		if sTools then
			sTools = sTools:gsub(" or ", ",");
			sTools = sTools:gsub(",%s", ",");
			sTools = sTools:gsub(",,", ",");
			for vTool in string.gmatch(sTools, "([^,]+)") do 
				local wndTools = w.selection_window.createWindowWithClass("race_sub_item");
				wndTools.bname.setText(StringManager.capitalize(vTool));
				wndTools.name.setValue(StringManager.capitalize(vTool));
			end	
		else
			if sText then
				print("ERROR - Unhandled Tool Selection Text for: " .. sText);
			else
				print("ERROR - Unhandled Tool Selection Text.");
			end
		end
	end
end

function createVariableTrait()
	local wVariableTrait = createWindow();
	wVariableTrait.group_name.setValue("SELECT VARIABLE TRAIT");
	wVariableTrait.group_number.setValue(2);
	wVariableTrait.selection_window.setColumnWidth(135);

	for kSkill,_ in pairs(DataCommon.skilldata) do 
		local wndSkills = wVariableTrait.selection_window.createWindowWithClass("race_sub_item");
		wndSkills.bname.setText(StringManager.capitalizeAll(kSkill));
		wndSkills.name.setValue(StringManager.capitalizeAll(kSkill));
		wndSkills.type.setValue(1);
		wndSkills.shortcut.setValue("ref_ability", "reference.skilldata." .. string.lower(kSkill) .. "@DD PHB Deluxe");			
	end
	local wndSkills = wVariableTrait.selection_window.createWindowWithClass("race_sub_item");
	wndSkills.bname.setText("Darkvision 60 feet");
	wndSkills.name.setValue("Darkvision 60 feet");
	wndSkills.type.setValue(11);
end

function createWeapons(v, wMartial, sGroupNumber, sType)
	local aWeapons = {};
	if sWeaponType and sWeaponType ~= "" then
		sWeaponType = string.lower(sWeaponType);
	end
	local aMappings = LibraryData.getMappings("item");
	for _,vMapping in ipairs(aMappings) do
		for _,vItems in pairs(DB.getChildrenGlobal(vMapping)) do	
			if StringManager.trim(DB.getValue(vItems, "type", "")):lower() == "weapon" then
				if StringManager.trim(DB.getValue(vItems, "subtype", "")):lower() == "martial weapons" or StringManager.trim(DB.getValue(vItems, "subtype", "")):lower() == "martial ranged weapons" then
					local sPHBWeaponLink = vItems.getPath();
					if string.match(sPHBWeaponLink, "DD PHB Deluxe") then				
						table.insert(aWeapons, StringManager.trim(DB.getValue(vItems, "name", "")):lower());
					end
				end
			end
		end
	end
	local aFinalWeapons = {};
	local aDupes = {};
	for _,v in ipairs(aWeapons) do
		if not aDupes[v] then
			table.insert(aFinalWeapons, v);
			aDupes[v] = true;
		end
	end
	wMartial.selection_window.setColumnWidth(135);	
	for _,vWeapon in pairs(aFinalWeapons) do
		local wndWeapons = wMartial.selection_window.createWindowWithClass("race_sub_item");
		wndWeapons.bname.setText(StringManager.capitalizeAll(vWeapon));
		wndWeapons.name.setValue(StringManager.capitalizeAll(vWeapon));
		wndWeapons.type.setValue(sType);
	end
end	

 
function parseSelection(sSelectionType, sSelectionGroup, sSelectionName, sSelectionClass, sSelectionRecord)
	local wndSummary = Interface.findWindow("charwizard", "");
	local nodeSource = DB.findNode(sSelectionRecord);
	local nCustomIncrease = 1;
	
	if sSelectionGroup == "SELECT RACE" then
		for _,vNewRace in pairs(getWindows()) do
			if vNewRace.group_name.getValue() ~= "SELECT RACE" then
				vNewRace.close()
			end
		end
		for _,vSelectRace in pairs(getWindows()) do		
			if vSelectRace.group_name.getValue() == "SELECT RACE" then			
				if CampaignRegistry.charwizard.race then
					CampaignRegistry.charwizard.race = {};
				end
				wndSummary.feat_alert.setVisible(false);				
				vSelectRace.selection_name.setValue(sSelectionName);
				vSelectRace.selection_shortcut.setVisible(true);
				vSelectRace.selection_shortcut.setValue(sSelectionClass, sSelectionRecord);
				
				CampaignRegistry.charwizard = CampaignRegistry.charwizard or {};
				CampaignRegistry.charwizard.race = CampaignRegistry.charwizard.race or {};
				
				CampaignRegistry.charwizard.race.name = string.lower(sSelectionName);
				CampaignRegistry.charwizard.race.class = sSelectionClass;				
				CampaignRegistry.charwizard.race.record = sSelectionRecord;
				
				if CampaignRegistry.charwizard.feats then
					CampaignRegistry.charwizard.feats.race = "";
					if CampaignRegistry.charwizard.feats.racebonus then
						CampaignRegistry.charwizard.feats.racebonus.bonus = 0;
					end						
				end
				
				if vSelectRace.selection_name.getValue() == "CUSTOM LINEAGE" then
					createSize(wndSummary);
					createVariableTrait(wndSummary);
				end

				clearAllFeats();
				wndSummary.calcSummaryStats();
				
				wndSummary.summary.subwindow.summary_race.setValue(sSelectionName);
				clearSummary(wndSummary);
				updateSummary(wndSummary, sSelectionClass, sSelectionRecord);
				wndSummary.updateProficiencies();				
				parseAbilityScores(wndSummary, sSelectionClass, sSelectionRecord);
			end
			vSelectRace.selection_window.setVisible(false);
		end

		if DB.getChildCount(nodeSource, "subraces") > 0 then
			local w = createWindow();
			w.group_name.setValue("SELECT SUBRACE");
			createSubraceList(sSelectionName, sSelectionClass, sSelectionRecord, w);
		end
		createTraitWindows(nodeSource, "1");
	else
		local sRaceClass = "";
		local sRaceRecord = "";
		local sRaceName = "";
		for _,vSelectSubrace in pairs(getWindows()) do
			if vSelectSubrace.group_name.getValue() == sSelectionGroup then
				if sSelectionGroup == "SELECT SUBRACE" then
					for _,vSelectSubraceRace in pairs(getWindows()) do
						if vSelectSubraceRace.group_name.getValue() == "SELECT RACE" then
							sRaceClass, sRaceRecord = vSelectSubraceRace.selection_shortcut.getValue();
						end
						if vSelectSubraceRace.group_number.getValue() == "2" then
							vSelectSubraceRace.close();
						end
					end
					vSelectSubrace.selection_name.setValue(sSelectionName);
					vSelectSubrace.selection_shortcut.setVisible(true);				
					vSelectSubrace.selection_shortcut.setValue(sSelectionClass, sSelectionRecord);
				
					CampaignRegistry.charwizard = CampaignRegistry.charwizard or {};
					CampaignRegistry.charwizard.race = CampaignRegistry.charwizard.race or {};
					CampaignRegistry.charwizard.race.subrace = {};
					
					CampaignRegistry.charwizard.race.subrace.name = string.lower(sSelectionName);
					CampaignRegistry.charwizard.race.subrace.class = sSelectionClass;				
					CampaignRegistry.charwizard.race.subrace.record = sSelectionRecord;					
					
					clearAllFeats();
					wndSummary.calcSummaryStats();
					
					createTraitWindows(nodeSource, "2");						
					wndSummary.summary.subwindow.summary_race.setValue(sSelectionName);
					clearSummary(wndSummary);
					updateSummary(wndSummary, sRaceClass, sRaceRecord);
					updateSummary(wndSummary, sSelectionClass, sSelectionRecord, true);
					wndSummary.updateProficiencies();					
					parseAbilityScores(wndSummary, sSelectionClass, sSelectionRecord);
					vSelectSubrace.selection_window.setVisible(false);
				elseif sSelectionGroup == "SELECT DRACONIC ANCESTRY" then
					vSelectSubrace.selection_name.setValue(sSelectionName);
					vSelectSubrace.selection_window.setVisible(false);
				elseif sSelectionGroup == "SELECT SIZE" then
					vSelectSubrace.selection_name.setValue(sSelectionName);
					wndSummary.summary.subwindow.summary_size.setValue(StringManager.capitalize(string.lower(sSelectionName)));
					vSelectSubrace.selection_window.setVisible(false);
				elseif sSelectionGroup == "SELECT VARIABLE TRAIT" then
					if sSelectionType == "11" then
						vSelectSubrace.selection_name.setValue("DARKVISION");
						wndSummary.summary.subwindow.summary_senses.setValue("Darkvision 60");
					else
						vSelectSubrace.selection_name.setValue(string.upper(sSelectionName));
						local wndSkillList = wndSummary.summary.subwindow.summary_skills.createWindow();
						wndSkillList.name.setValue(StringManager.capitalizeAll(string.lower(sSelectionName)));
						wndSkillList.type.setValue("race");
						wndSummary.summary.subwindow.summary_skills.applySort();						
					end
					vSelectSubrace.selection_window.setVisible(false);					
				elseif sSelectionGroup == "SELECT TOOL PROFICIENCY" then
					vSelectSubrace.selection_name.setValue(sSelectionName);
					
					CampaignRegistry.charwizard = CampaignRegistry.charwizard or {};
					CampaignRegistry.charwizard.race = CampaignRegistry.charwizard.race or {};					
					
					CampaignRegistry.charwizard.race.tool = string.lower(sSelectionName);
					wndSummary.updateProficiencies();
					vSelectSubrace.selection_window.setVisible(false);					
				elseif sSelectionGroup == "SELECT SPELL" then
					vSelectSubrace.selection_name.setValue(sSelectionName);
					vSelectSubrace.selection_shortcut.setValue("reference_spell", sSelectionClass);
					vSelectSubrace.selection_shortcut.setVisible(true);
					CampaignRegistry.charwizard = CampaignRegistry.charwizard or {};
					CampaignRegistry.charwizard.spelllist = CampaignRegistry.charwizard.spelllist or {};					
					
					table.insert(CampaignRegistry.charwizard.spelllist, {class = "reference_spelldata", record = sSelectionClass});
					vSelectSubrace.selection_window.setVisible(false);
				elseif sSelectionGroup == "SELECT LANGUAGE" then
					if sSelectionType == vSelectSubrace.selection_type.getValue() then					
						local sSubraceClass = "";
						local sSubraceRecord = "";
						local sRaceName = "";
						local bSubrace = false;
						for _,vSelectLanguage in pairs(getWindows()) do
							if vSelectLanguage.group_name.getValue() == "SELECT RACE" then
								sRaceClass, sRaceRecord = vSelectLanguage.selection_shortcut.getValue();
							end
							if vSelectLanguage.group_name.getValue() == "SELECT SUBRACE" then
								sSubraceClass, sSubraceRecord = vSelectLanguage.selection_shortcut.getValue();
								bSubrace = true;
							end						
						end
						updateLanguages(wndSummary, DB.findNode(sRaceRecord), false, true);
						if sSubraceRecord and sSubraceRecord ~= "" then
							updateLanguages(wndSummary, DB.findNode(sSubraceRecord), bSubrace, true);
						end

						vSelectSubrace.selection_name.setValue(sSelectionName);

						local bLanguageFound = false;
						local wndCurrentLangList = wndSummary.summary.subwindow.summary_languages.getWindows();
						for _,vLang in pairs(wndCurrentLangList) do
							if string.upper(vLang.language.getValue()) == sSelectionName then
								bLanguageFound = true;	
							end
						end
						if not bLanguageFound then
							local wndLangList = wndSummary.summary.subwindow.summary_languages.createWindow();
							wndLangList.language.setValue(StringManager.capitalizeAll(string.lower(sSelectionName)));
							wndLangList.type.setValue("race");
							wndSummary.summary.subwindow.summary_languages.applySort();
						end
						vSelectSubrace.selection_window.setVisible(false);
					else
						for _,vReservedLang in pairs(vSelectSubrace.selection_window.getWindows()) do					
							if string.upper(vReservedLang.name.getValue()) == sSelectionName then
								vReservedLang.bname.setVisible(false);
							else
								vReservedLang.bname.setVisible(true);
							end
						end
					end
				elseif sSelectionGroup == "SELECT MARTIAL WEAPON" then
					if sSelectionType == vSelectSubrace.selection_type.getValue() then
						local aWeapons = {};
						vSelectSubrace.selection_name.setValue(sSelectionName);
						vSelectSubrace.selection_name.setVisible(true);						
						for _,vSelectWeapon in pairs(getWindows()) do
							if vSelectWeapon.group_name.getValue() == "SELECT MARTIAL WEAPON" then
								if vSelectWeapon.selection_name.getValue() ~= "" then
									table.insert(aWeapons, vSelectWeapon.selection_name.getValue());
								end
							end
						end
						CampaignRegistry.charwizard.race.weapons = aWeapons;
						wndSummary.updateProficiencies();
						vSelectSubrace.selection_window.setVisible(false);						
					else
						for _,vReservedWeapon in pairs(vSelectSubrace.selection_window.getWindows()) do
							if string.upper(vReservedWeapon.name.getValue()) == sSelectionName then
								vReservedWeapon.bname.setVisible(false);
							else
								vReservedWeapon.bname.setVisible(true);
							end
						end					
					end					
				elseif sSelectionGroup == "SELECT SKILL PROFICIENCY" then
					if sSelectionType == vSelectSubrace.selection_type.getValue() then
						vSelectSubrace.selection_name.setValue(sSelectionName);
						updateSkills(wndSummary, sSelectionRecord);
						vSelectSubrace.selection_window.setVisible(false);						
					else
						for _,vReservedSkill in pairs(vSelectSubrace.selection_window.getWindows()) do
							if string.upper(vReservedSkill.name.getValue()) == sSelectionName then
								vReservedSkill.bname.setVisible(false);
								vReservedSkill.shortcut.setVisible(false);								
							else
								vReservedSkill.bname.setVisible(true);
								vReservedSkill.shortcut.setVisible(true);
							end
						end					
					end
				elseif sSelectionGroup == "SELECT ABILITY SCORE" then
					if sSelectionType == vSelectSubrace.selection_type.getValue() then
						local aAbilityScores = {};
						vSelectSubrace.selection_name.setValue(sSelectionName);
						for _,vAbilityCheck in pairs(getWindows()) do
							if vAbilityCheck.group_name.getValue() == "SELECT ABILITY SCORE" then
								if vAbilityCheck.selection_name.getValue() ~= "" then
									table.insert(aAbilityScores, string.lower(DataCommon.ability_ltos[string.lower(vAbilityCheck.selection_name.getValue())]));
								end
							end
						end
						for _,vAbilityShort in pairs(DataCommon.ability_ltos) do
							if CampaignRegistry.charwizard.race.abilities[string.lower(vAbilityShort)] < 2 then
								CampaignRegistry.charwizard.race.abilities[string.lower(vAbilityShort)] = 0;
							end
						end
						for _,vChangeScore in pairs(aAbilityScores) do
							for _,vCustomLineage in pairs(getWindows()) do
								if vCustomLineage.group_name.getValue() == "SELECT RACE" and vCustomLineage.selection_name.getValue() == "CUSTOM LINEAGE" then
									nCustomIncrease = 2;
								end
							end
							CampaignRegistry.charwizard.race.abilities[vChangeScore] = nCustomIncrease;
						end
						
						wndSummary.calcSummaryStats();
						vSelectSubrace.selection_window.setVisible(false);						
					else
						for _,vReservedAbility in pairs(vSelectSubrace.selection_window.getWindows()) do
							if string.upper(vReservedAbility.name.getValue()) == sSelectionName then
								vReservedAbility.bname.setVisible(false);
							else
								vReservedAbility.bname.setVisible(true);
							end
						end
					end
				end
			end
		end
	end
	getRaceAlerts(wndSummary);
	wndSummary.updateGateCheck();
end

function clearAllFeats()
	-- Reset Feat Choices if Race Changes (REMOVE When Feats remember choices)
	if CampaignRegistry.charwizard.feats and CampaignRegistry.charwizard.feats.class then
		for _,vClassFeats in pairs(CampaignRegistry.charwizard.feats.class) do
			if vClassFeats.asi or vClassFeats.feat then
				vClassFeats.asi = {};
				vClassFeats.feat = "";
				vClassFeats.record = "";
				vClassFeats.classbonus = {};
			end
		end
	end
end

function createTraitWindows(nodeSource, sGroupNumber)
	local wndSummary = Interface.findWindow("charwizard", "");
	for _,v in pairs(DB.getChildren(nodeSource, "traits")) do
		local sTraitType = CampaignDataManager2.sanitize(DB.getValue(v, "name", ""));
		if sTraitType == "" then
			sTraitType = nodeSource.getName();
		end
		if sTraitType == ("feat") then
			CampaignRegistry.charwizard.feats = CampaignRegistry.charwizard.feats or {};
			CampaignRegistry.charwizard.feats.race = "";
			wndSummary.feat_alert.setVisible(true);			
		end
		if sTraitType == ("draconicancestry") then
			local wDraconicAncestry = createWindow();
			wDraconicAncestry.group_name.setValue("SELECT DRACONIC ANCESTRY");
			wDraconicAncestry.group_number.setValue(sGroupNumber);
			createDragons(v, wDraconicAncestry)			
		end			
		if sTraitType == ("toolproficiency") or sTraitType == "specializeddesign" then
			local wTools = createWindow();
			wTools.group_name.setValue("SELECT TOOL PROFICIENCY");
			wTools.group_number.setValue(sGroupNumber);			
			createTools(v, wTools, wndSummary)			
		end
		if string.match(sTraitType, "skill") or sTraitType == "menacing" or sTraitType == "survivor" or sTraitType == "imposingpresence" or sTraitType == "tirelessprecision" or sTraitType == "changelinginstincts" or sTraitType == "primalintuition" or sTraitType == "specializeddesign" or sTraitType == "kenkutraining" or sTraitType == "hunter_slore" then
			local aLimitedSkills = {};
			local sAdjust = DB.getText(v, "text"):lower();
			local bLimited = sAdjust:match("following");
			local bChoice = sAdjust:match("choice");
			if bLimited then
				local sSkillText = sAdjust:match("choice: ([^.]+)");
				if not sSkillText then
					sSkillText = sAdjust:match("following skills: ([^.]+)");
				end
				if not sSkillText then
					sSkillText = sAdjust:match("following list: ([^.]+)");
				end
				if not sSkillText then
					sSkillText = sAdjust:match("following skills of your choice ([^.]+)");
				end				
				if sSkillText then
					sSkillText = sSkillText:gsub("or ", "");
					sSkillText = sSkillText:gsub("and ", "");				
					for s in string.gmatch(sSkillText, "(%a[%a%s]+)%,?") do
						table.insert(aLimitedSkills, s);
					end
				end
			end
			
			if bChoice then		
				if sAdjust:match("two") then
					for i=1,2 do
						local wSkillChoice = createWindow();
						wSkillChoice.group_name.setValue("SELECT SKILL PROFICIENCY");
						wSkillChoice.group_number.setValue(sGroupNumber);						
						wSkillChoice.selection_shortcut.setVisible(false);
						wSkillChoice.selection_type.setValue(i);
						createSkills(v, wSkillChoice, i, aLimitedSkills);
					end
				else
					local wSkill = createWindow();
					wSkill.group_name.setValue("SELECT SKILL PROFICIENCY");
					wSkill.group_number.setValue(sGroupNumber);					
					wSkill.selection_shortcut.setVisible(false);					
					createSkills(v, wSkill, "", aLimitedSkills);
				end
			end
		end		
		if string.match(sTraitType, "language") or sTraitType == "cat_stalent" then
			local sAdjust = DB.getText(v, "text"):lower();
			local bChoice = sAdjust:match("choice");
			local bChangeling = sAdjust:match("two");
			local bCustomLineage = sAdjust:match("you and your dm agree");
			if bChoice or bCustomLineage then
				local wLanguage = createWindow();
				wLanguage.group_name.setValue("SELECT LANGUAGE");
				wLanguage.group_number.setValue(sGroupNumber);
				wLanguage.selection_type.setValue(1);
				createLanguages(v, wLanguage, 1)
				if bChangeling then
					local wChangeling = createWindow();
					wChangeling.group_name.setValue("SELECT LANGUAGE");
					wChangeling.group_number.setValue(sGroupNumber);
					wChangeling.selection_type.setValue(2);
					createLanguages(v, wChangeling, 2)
				end
			end
		end
		if string.match(sTraitType, "cantrip") then
			local sAdjust = DB.getText(v, "text"):lower();
			local bChoice = sAdjust:match("choice");
			if bChoice then
				local wCantrip = createWindow();
				wCantrip.group_name.setValue("SELECT SPELL");
				wCantrip.group_number.setValue(sGroupNumber);				
				createSpells(v, wCantrip, sGroupNumber, 0, "wizard");
			end
		end
		if string.match(sTraitType, "martialtraining") then
			for i=1,2 do
				local wMartial = createWindow();
				wMartial.group_name.setValue("SELECT MARTIAL WEAPON");
				wMartial.group_number.setValue(sGroupNumber);
				wMartial.selection_type.setValue(i);
				createWeapons(v, wMartial, sGroupNumber, i);
			end
		end				
		if sTraitType == "abilityscoreincrease" or sTraitType == "abilityscoreincreases" then
			local aIncreases = {};
			local sAdjust = DB.getText(v, "text"):lower();
			local bChoice = sAdjust:match("choice");
			if bChoice then
				if sAdjust:gmatch("[Yy]our (%w+) score increases by (%d+)") then
					for a1, sIncrease in sAdjust:gmatch("[Yy]our (%w+) score increases by (%d+)") do
						local nIncrease = tonumber(sIncrease) or 0;
						aIncreases[a1] = nIncrease;
					end
				end
				if sAdjust:match("two") then
					for i=1,2 do
						local w = createWindow();
						w.group_name.setValue("SELECT ABILITY SCORE");
						w.group_number.setValue(sGroupNumber);						
						w.selection_shortcut.setVisible(false);
						w.selection_type.setValue(i);
						createAbilities(w, aIncreases, sSelectionName, i, sSelectionClass, sSelectionRecord);
					end
				else
					local w = createWindow();
					w.group_name.setValue("SELECT ABILITY SCORE");
					w.group_number.setValue(sGroupNumber);					
					w.selection_shortcut.setVisible(false);
					createAbilities(w, aIncreases, sSelectionName, "", sSelectionClass, sSelectionRecord);					
				end
			end
		end
	end
end

function clearSummary(wndSummary)
	wndSummary.summary.subwindow.summary_size.setValue("");
	wndSummary.summary.subwindow.summary_speed.setValue("");
	wndSummary.summary.subwindow.summary_speedspecial.setValue("");	
	wndSummary.summary.subwindow.summary_senses.setValue("");
	wndSummary.summary.subwindow.summary_proficiencies.closeAll();
	wndSummary.closeSubType("all", "race");
end

function parseAbilityScores(wndSummary, sSelectionClass, sSelectionRecord)
	local aResults = {};
	local aRaceResults = {};
	local aRecordLoop = {};
	table.insert(aRecordLoop, sSelectionRecord);
	if sSelectionClass == "reference_subrace" then
		for _,vRaceSelected in pairs(getWindows()) do
			if vRaceSelected.group_name.getValue() == "SELECT RACE" then
				local sRaceSelectionClass, sRaceSelectionRecord = vRaceSelected.selection_shortcut.getValue();
				table.insert(aRecordLoop, sRaceSelectionRecord);
			end
		end
	end
	for i=1,#aRecordLoop do
		local nodeSource = DB.getChild(DB.findNode(aRecordLoop[i]), "traits.abilityscoreincrease");
		if not nodeSource then
			return;
		end	
		local bApplied = false;
		
		local sAdjust = DB.getText(nodeSource, "text"):lower();
		if sAdjust:match("your ability scores each increase") then

			-- Ex: "ABILITY:1:STR", "ABILITY:1:DEX", "ABILITY:1:CON", "ABILITY:1:INT", "ABILITY:1:WIS", "ABILITY:1:CHA"
			for k,v in pairs(DataCommon.abilities) do
				table.insert(aResults, DataCommon.ability_ltos[v] .. ":" .. 1);
			end
		else
			local aIncreases = {};
			
			local n1, n2;
			local a1, a2, sIncrease = sAdjust:match("your (%w+) and (%w+) scores increase by (%d+)");
			if not a1 then
				a1, a2, sIncrease = sAdjust:match("your (%w+) and (%w+) scores both increase by (%d+)");
			end
			if not a1 then
				a1, a2, a3, sIncrease = sAdjust:match("your (%w+) score, (%w+) score, and (%w+) score each increase by (%d+)");
			end			
			if a1 then
				local nIncrease = tonumber(sIncrease) or 0;
				aIncreases[a1] = nIncrease;
				aIncreases[a2] = nIncrease;
				aIncreases[a3] = nIncrease;				
			else
				sAdjust = sAdjust:gsub(", and ", "");
				for a1, sIncrease in sAdjust:gmatch("your (%w+) score increases by (%d+)") do
					local nIncrease = tonumber(sIncrease) or 0;
					aIncreases[a1] = nIncrease;
				end
				for a1, sDecrease in sAdjust:gmatch("your (%w+) score is reduced by (%d+)") do
					local nDecrease = tonumber(sDecrease) or 0;
					aIncreases[a1] = nDecrease * -1;
				end
			end
			for k,v in pairs(aIncreases) do
				table.insert(aResults, DataCommon.ability_ltos[k] .. ":" .. v);
			end
		end
		updateAbilityScores(aResults, wndSummary, sSelectionClass, sSelectionRecord);
	end
	updateAbilityScores(aResults, wndSummary, sSelectionClass, sSelectionRecord);
end

function updateAbilityScores(aResults, wndSummary, sSelectionClass, sSelectionRecord)
	CampaignRegistry.charwizard = CampaignRegistry.charwizard or {};
	CampaignRegistry.charwizard.race = CampaignRegistry.charwizard.race or {};
	CampaignRegistry.charwizard.race.abilities = CampaignRegistry.charwizard.race.abilities or {};

	for _,vDBRaceAbilityScore in pairs(DataCommon.ability_ltos) do
		CampaignRegistry.charwizard.race.abilities[string.lower(vDBRaceAbilityScore)] = 0;
	end
	
	for _,vAbilityScore in pairs(aResults) do
		local aAbilityScoreColonSplit = StringManager.split(vAbilityScore, ":");
		nScoreAdjust = tonumber(aAbilityScoreColonSplit[2] or "") or 0;
		sAbilityAdjust = aAbilityScoreColonSplit[1] or "";
		CampaignRegistry.charwizard.race.abilities[string.lower(sAbilityAdjust)] = nScoreAdjust;
	end	
	
	wndSummary.calcSummaryStats();
end

function updateSummary(wndSummary, sSelectionClass, sSelectionRecord, bSubrace)
	local nodeSource = DB.findNode(sSelectionRecord);

	if not nodeSource then
		return;
	end

	for _,v in pairs(DB.getChildren(nodeSource, "traits")) do
		local sTraitType = CampaignDataManager2.sanitize(DB.getValue(v, "name", ""));

		if sTraitType == "" then
			sTraitType = nodeSource.getName();
		end
		
		if sTraitType == "size" then
			local sSubraceTrait = DB
			local sSize = DB.getText(v, "text");
			sSize = sSize:match("[Yy]our size is (%w+)");
			if not sSize then
				sSize = "Medium";
			end
			wndSummary.summary.subwindow.summary_size.setValue(StringManager.capitalize(sSize));		
		elseif sTraitType == "speed" then
			local sSpeed = DB.getText(v, "text");
			
			local sWalkSpeed = sSpeed:match("(%d+)");
			if not sWalkSpeed then
				sWalkSpeed = sSpeed:match("land speed is (%d+) feet");
			elseif not sWalkSpeed then
				sWalkSpeed = sSpeed:match("(%d+)");
			end

			if sWalkSpeed then
				local nSpeed = tonumber(sWalkSpeed) or 30;
				wndSummary.summary.subwindow.summary_speed.setValue(nSpeed);
			end
			local sSwimSpeed = sSpeed:match("swimming speed of (%d+)");
			if sSwimSpeed then
				wndSummary.summary.subwindow.summary_speedspecial.setValue("Swim " .. sSwimSpeed .. " ft.");
			end
		elseif sTraitType == "fleetoffoot" then
			local sFleetOfFoot = DB.getText(v, "text");
			
			local sWalkSpeedIncrease = sFleetOfFoot:match("(%d+)");
			if sWalkSpeedIncrease then
				local nSpeed = tonumber(sWalkSpeed) or 35;
				wndSummary.summary.subwindow.summary_speed.setValue(nSpeed);
			end
		elseif string.match(sTraitType, "cat_sclaws") then
			local sClimb = DB.getText(v, "text");		
			local sClimbSpeed = sClimb:match("(%d+)");
			wndSummary.summary.subwindow.summary_speedspecial.setValue("Climb " .. sClimbSpeed .. " ft.");			
		elseif string.match(sTraitType, "swim") or sTraitType == "childofthesea" then
			local sSwim = DB.getText(v, "text");		
			local sSwimSpeed = sSwim:match("(%d+)");
			wndSummary.summary.subwindow.summary_speedspecial.setValue("Swim " .. sSwimSpeed .. " ft.");
		elseif sTraitType == "flight" or sTraitType == "winged" then
			local sFlight = DB.getText(v, "text");		
			local sFlySpeed = sFlight:match("(%d+)");
			wndSummary.summary.subwindow.summary_speedspecial.setValue("Fly " .. sFlySpeed .. " ft.");
		elseif sTraitType == "darkvision" then
			local sSenses = DB.getText(v, "text");		
			local sDarkVision = sSenses:match("(%d+)");
			if sDarkVision then
				local nDist = tonumber(sDarkVision) or 60;
				wndSummary.summary.subwindow.summary_senses.setValue("Darkvision " .. nDist);
			end
		elseif sTraitType == "superiordarkvision" then
			local sSenses = DB.getText(v, "text");		
			local sDarkVision = sSenses:match("(%d+)");
			if sDarkVision then
				local nDist = tonumber(sDarkVision) or 120;
				wndSummary.summary.subwindow.summary_senses.setValue("Superior Darkvision " .. nDist);
			end
		elseif (sTraitType ~= "kenkutraining" and string.match(sTraitType, "training")) or sTraitType == "martialprodigy" then
			wndSummary.updateProficiencies();
		elseif string.match(sTraitType, "language") then
			updateLanguages(wndSummary, v, bSubrace, true);
		elseif string.match(sTraitType, "skill") or sTraitType == "fierce" or sTraitType == "naturaltracker" or sTraitType == "graceful" or sTraitType == "naturalathlete" or sTraitType == "keensenses" or sTraitType == "menacing" or sTraitType == "sneaky" or sTraitType == "cat_stalent" or sTraitType == "survivalinstinct" or sTraitType == "hunter_slore" then
			-- Since Tabaxi are cats and have to cause problems, we need to call updateLanguages() from inside the skill trap.
			if sTraitType == "cat_stalent" then
				updateLanguages(wndSummary, v, bSubrace, true);			
			end
			updateSkills(wndSummary, v);			
		elseif sTraitType == "feat" then
		elseif sTraitType == "alignment" then
		elseif sTraitType == "age" then
		elseif sTraitType == "subrace" then
		elseif sTraitType == "toolproficiency" then
		elseif sTraitType == "creaturetype" then			
		elseif sTraitType == "abilityscoreincrease" or sTraitType == "abilityscoreincreases" then
		elseif sTraitType == "survivor" or sTraitType == "imposingpresence" or sTraitType == "tirelessprecision" or sTraitType == "primalintuition" then
		else
			local wndTraitList = wndSummary.summary.subwindow.summary_traits.createWindow();
			wndTraitList.name.setValue(DB.getValue(v, "name"));
			wndTraitList.type.setValue("race");
			wndSummary.summary.subwindow.summary_traits.applySort();
		end
	end
end

function updateLanguages(wndSummary, sRecord, bSubrace, bSelect)
	local aLanguages = {};
	local sSelectedClass = "";
	local sSelectedRecord = "";
	if not bSubrace then
		wndSummary.closeSubType("languages", "race");
	end
	local sText = DB.getText(sRecord, "text");

	if not sText or bSelect then
		for _,vTrait in pairs(DB.getChildren(sRecord, "traits")) do
			if string.match(CampaignDataManager2.sanitize(DB.getValue(vTrait, "name", "")), "language") or string.match(CampaignDataManager2.sanitize(DB.getValue(vTrait, "name", "")), "cat_stalent") then
				sText = DB.getText(vTrait, "text");
			end
		end
	end

	local sLanguages = sText:match("You can speak, read, and write ([^.]+)");
	if not sLanguages then
		sLanguages = sText:match("You can read and write ([^.]+)");
	end
	if not sLanguages then
		sLanguages = sText:match("You speak, read, and write ([^.]+)");
	end	

	if not sLanguages then
		return false;
	end

	sLanguages = sLanguages:gsub(" and one other language that you and your DM agree is appropriate for your character", "");
	sLanguages = sLanguages:gsub("and ", ",");
	sLanguages = sLanguages:gsub("one extra language of your choice", "Choice");
	sLanguages = sLanguages:gsub("one other language of your choice", "Choice");
	sLanguages = sLanguages:gsub("one additional language of your choice", "Choice");
	sLanguages = sLanguages:gsub("two other languages of your choice", "Choice");
	sLanguages = sLanguages:gsub(", but you can speak only by using your Mimicry trait", "");	
	sLanguages = sLanguages:gsub(" ", "");			
	sLanguages = sLanguages:gsub(", but you.*$", "");

	for s in string.gmatch(sLanguages, "(%a[%a%s]+)%,?") do
		if not s:match("Choice") then
			local wndLangList = wndSummary.summary.subwindow.summary_languages.createWindow();
			wndLangList.language.setValue(StringManager.capitalize(s));
			wndLangList.type.setValue("race");
			wndSummary.summary.subwindow.summary_languages.applySort();
		end
	end
end

function updateFeats(wndSummary, sRecord)
	local sPrerequisite = "";
	local sText = DB.getValue(DB.findNode(sRecord), "text");	
	if string.match(sText, "Prerequisite:") then
		sPrerequisite = sText:match("Prerequisite: ([^.]+)");
	end
end

function updateSkills(wndSummary, sRecord)
	wndSummary.closeSubType("skills", "race");
	local sText = DB.getValue(sRecord, "text");
	local sSkillText = sText:match("You have proficiency in the ([^.]+)");
	if not sSkillText then
		sSkillText = sText:match("You gain proficiency in the ([^.]+)");
	end
	if not sSkillText then
		sSkillText = sText:match("You are proficient in the ([^.]+)");
	end	
	if not sSkillText then
		sSkillText = sText:match("You are trained in the ([^.]+)");
	end
	local aSkills = {};
	if sSkillText then
		sSkillText = sSkillText:gsub(" skills", "");
		sSkillText = sSkillText:gsub(" skill", "");
		sSkillText = sSkillText:gsub(" and ", ",");
		sSkillText = sSkillText:gsub("and ", ",");
	
		local aSkillTestCommaSplit = StringManager.split(sSkillText, ",");
		if #aSkillTestCommaSplit > 1 then
			table.insert(aSkills, aSkillTestCommaSplit[1]);
			table.insert(aSkills, aSkillTestCommaSplit[2]);			
		else
			table.insert(aSkills, sSkillText);
		end
		sSkillText = "";
	end
	for _,v in pairs(getWindows()) do
		if v.group_name.getValue() == "SELECT SKILL PROFICIENCY" then
			sSkillText = v.selection_name.getValue();
			if sSkillText ~= "" then
				table.insert(aSkills, sSkillText);
				sSkillText = "";
			end
		end
	end	

	for i=1,#aSkills do
		local wndSkillList = wndSummary.summary.subwindow.summary_skills.createWindow();
		wndSkillList.name.setValue(StringManager.capitalizeAll(string.lower(aSkills[i])));
		wndSkillList.type.setValue("race");
		wndSummary.summary.subwindow.summary_skills.applySort();	
	end
	wndSummary.getSkillDuplicates("race");
end

function getRaceAlerts(wndSummary)
	local aAlerts = {};
	for _,vRaceAlert in pairs(getWindows()) do
		if vRaceAlert.selection_name.getValue() == "" then
			table.insert(aAlerts, vRaceAlert.group_name.getValue());
		end
	end
	local aFinalAlerts = {};
	local aDupes = {};
	for _,v in ipairs(aAlerts) do
		if not aDupes[v] then
			table.insert(aFinalAlerts, v);
			aDupes[v] = true;
		end
	end
	wndSummary.updateAlerts(aFinalAlerts, "race");
end

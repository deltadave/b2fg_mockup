-- 
-- Please see the license.html file included with this distribution for 
-- attribution and copyright information.
--

RACE_DWARF = "dwarf";
RACE_DUERGAR = "duergar";

CLASS_BARBARIAN = "barbarian";
CLASS_MONK = "monk";
CLASS_SORCERER = "sorcerer";

TRAIT_DWARVEN_TOUGHNESS = "dwarven toughness";
TRAIT_GNOME_CUNNING = "gnome cunning";
TRAIT_POWERFUL_BUILD = "powerful build";
TRAIT_NATURAL_ARMOR = "natural armor";
TRAIT_CATS_CLAWS = "cat's claws";

FEATURE_UNARMORED_DEFENSE = "unarmored defense";
FEATURE_DRACONIC_RESILIENCE = "draconic resilience";
FEATURE_PACT_MAGIC = "pact magic";
FEATURE_SPELLCASTING = "spellcasting";
FEATURE_ELDRITCH_INVOCATIONS = "eldritch invocations";

FEAT_DRAGON_HIDE = "dragon hide";
FEAT_DURABLE = "durable";
FEAT_MEDIUM_ARMOR_MASTER = "medium armor master";
FEAT_TOUGH = "tough";
FEAT_WAR_CASTER = "war caster";

function onInit()
	initializeCampaignRegistry();
	tabs.activateTab(2);
	tabs.activateTab(1);
end

function onClose()
	CampaignRegistry.charwizard = {};
end

function initializeCampaignRegistry()
	CampaignRegistry.charwizard = {};	
	CampaignRegistry.charwizard.abilities = {};
	CampaignRegistry.charwizard.race = {};
	CampaignRegistry.charwizard.race.abilities = {};
	
	local aStandardArray = {15, 14, 13, 12, 10, 8};
	for i=1,#aStandardArray do
		CampaignRegistry.charwizard.abilities["genval" .. i] = aStandardArray[i];
	end
	for _,vCRRaceAbilityScore in pairs(DataCommon.ability_ltos) do
		CampaignRegistry.charwizard.race.abilities[string.lower(vCRRaceAbilityScore)] = 0;
	end
end

function getGateStatus()
	aControls = self.getControls();
	aControlNames = {};
	for _,vControls in pairs(aControls) do
		if string.find(vControls.getName(), "_GateCheck") then
			local cName = vControls.getName();
			table.insert(aControlNames, cName);
		end
	end
	local bGateCheck = true;
	for _,vControlName in pairs(aControlNames) do
		if self[vControlName].getValue() == 0 then
			bGateCheck = false;
		end
	end
	if getSkillDuplicates() then
		bGateCheck = false;
	end
	if bGateCheck then
		checkExpertise();
	end
	if CampaignRegistry.charwizard.import then
		bGateCheck = true;
	end
	return bGateCheck;
end

function updateGateCheck()
	aControls = self.getControls();
	aControlNames = {};
	for _,vControls in pairs(aControls) do
		if string.find(vControls.getName(), "_GateCheck") then
			local cName = vControls.getName();
			table.insert(aControlNames, cName);
		end
	end
	local bGateCheck = true;
	for _,vControlName in pairs(aControlNames) do
		if self[vControlName].getValue() == 0 then
			bGateCheck = false;
		end
	end
	if getSkillDuplicates() then
		bGateCheck = false;
	end
	if CampaignRegistry.charwizard.import then
		bGateCheck = true;
	end
	if bGateCheck then
		if CampaignRegistry.charwizard.expertise then
			bGateCheck = false;
			class_alert.setVisible(true);
			class_GateCheck.setValue(0);
		end
	end
	if bGateCheck then
		commit.setEnabled(true);
		commit.setFrame("buttonup", 5,5,5,5);
	else
		commit.setEnabled(false);
		commit.setFrame("buttondisabled", 5,5,5,5);
	end
end

function outputUserMessage(sResource, ...)
	local sFormat = Interface.getString(sResource);
	local sMsg = string.format(sFormat, ...);
	ChatManager.SystemMessage(sMsg);
end

function resolveRefNode(sRecord)
	if sRecord == nil or sRecord == "" then
		return;
	end

	local nodeSource = DB.findNode(sRecord);
	if not nodeSource then
		local sRecordSansModule = StringManager.split(sRecord, "@")[1] or "";
		nodeSource = DB.findNode(sRecordSansModule .. "@*");
		if not nodeSource then
			outputUserMessage("char_error_missingrecord");
		end
	end
	return nodeSource;
end

function calcSummaryStats()

	local nSTR = 0;
	local nDEX = 0;
	local nCON = 0;
	local nINT = 0;
	local nWIS = 0;
	local nCHA = 0;	

	if CampaignRegistry.charwizard.abilities then
		nSTR = nSTR + tonumber(CampaignRegistry.charwizard.abilities.genval1);
		nDEX = nDEX + tonumber(CampaignRegistry.charwizard.abilities.genval2);
		nCON = nCON + tonumber(CampaignRegistry.charwizard.abilities.genval3);
		nINT = nINT + tonumber(CampaignRegistry.charwizard.abilities.genval4);
		nWIS = nWIS + tonumber(CampaignRegistry.charwizard.abilities.genval5);
		nCHA = nCHA + tonumber(CampaignRegistry.charwizard.abilities.genval6);		
	else
		nSTR = 15;
		nDEX = 14;
		nCON = 13;
		nINT = 12;
		nWIS = 10;
		nCHA = 8;
	end
	if CampaignRegistry.charwizard.race and CampaignRegistry.charwizard.race.abilities then
		nSTR = nSTR + tonumber(CampaignRegistry.charwizard.race.abilities.str);
		nDEX = nDEX + tonumber(CampaignRegistry.charwizard.race.abilities.dex);
		nCON = nCON + tonumber(CampaignRegistry.charwizard.race.abilities.con);
		nINT = nINT + tonumber(CampaignRegistry.charwizard.race.abilities.int);
		nWIS = nWIS + tonumber(CampaignRegistry.charwizard.race.abilities.wis);
		nCHA = nCHA + tonumber(CampaignRegistry.charwizard.race.abilities.cha);	
	end
	if CampaignRegistry.charwizard.race and CampaignRegistry.charwizard.race.abilities then
		for k,v in pairs(DataCommon.ability_ltos) do
			if summary.subwindow then
				summary.subwindow["summary_race_" .. string.lower(v)].setValue(CampaignRegistry.charwizard.race.abilities[v]);
			end
		end
	end
	if CampaignRegistry.charwizard.feats and CampaignRegistry.charwizard.feats.class then
		local nASIBonus = 1;
		for _,vCRASINodes in pairs(CampaignRegistry.charwizard.feats.class) do
			if vCRASINodes.asi then
				for _,vASIAbilityVar in pairs(vCRASINodes.asi) do
					if vASIAbilityVar.name == "nSTR" then
						nSTR = nSTR + vASIAbilityVar.value;
					elseif vASIAbilityVar.name == "nDEX" then
						nDEX = nDEX + vASIAbilityVar.value;
					elseif vASIAbilityVar.name == "nCON" then
						nCON = nCON + vASIAbilityVar.value;
					elseif vASIAbilityVar.name == "nINT" then
						nINT = nINT + vASIAbilityVar.value;
					elseif vASIAbilityVar.name == "nWIS" then
						nWIS = nWIS + vASIAbilityVar.value;
					elseif vASIAbilityVar.name == "nCHA" then
						nCHA = nCHA + vASIAbilityVar.value;
					end
				end
			end
			if vCRASINodes.classbonus then 
				local sAbility = vCRASINodes.classbonus.ability;
				local nBonus = vCRASINodes.classbonus.bonus;
				if sAbility == "Strength" then
					nSTR = nSTR + nBonus;
				elseif sAbility == "Dexterity" then
					nDEX = nDEX + nBonus;
				elseif sAbility == "Constitution" then
					nCON = nCON + nBonus;
				elseif sAbility == "Intelligence" then
					nINT = nINT + nBonus;
				elseif sAbility == "Wisdom" then
					nWIS = nWIS + nBonus;
				elseif sAbility == "Charisma" then
					nCHA = nCHA + nBonus;
				end
			end
		end
	end
	if CampaignRegistry.charwizard.feats and CampaignRegistry.charwizard.feats.racebonus then
		local sAbility = CampaignRegistry.charwizard.feats.racebonus.ability;
		local nBonus = CampaignRegistry.charwizard.feats.racebonus.bonus;
		if sAbility == "Strength" then
			nSTR = nSTR + nBonus;
		elseif sAbility == "Dexterity" then
			nDEX = nDEX + nBonus;
		elseif sAbility == "Constitution" then
			nCON = nCON + nBonus;
		elseif sAbility == "Intelligence" then
			nINT = nINT + nBonus;
		elseif sAbility == "Wisdom" then
			nWIS = nWIS + nBonus;
		elseif sAbility == "Charisma" then
			nCHA = nCHA + nBonus;
		end			
	end
	summary.subwindow.summary_genval1.setValue(nSTR);
	summary.subwindow.summary_genval2.setValue(nDEX);
	summary.subwindow.summary_genval3.setValue(nCON);
	summary.subwindow.summary_genval4.setValue(nINT);
	summary.subwindow.summary_genval5.setValue(nWIS);
	summary.subwindow.summary_genval6.setValue(nCHA);
end

function clearRaceStatAdjust(aSetting)
	if aSetting then
		applyRaceStatAdjust(aSetting)
	else
		local aStatAdjust = {"STR:0", "DEX:0", "CON:0", "INT:0", "WIS:0", "CHA:0"};
		applyRaceStatAdjust(aStatAdjust)
	end
end

function updateAlerts(aAlerts, sPage)
	local bDupeSkillAlert = false;
	for _,v in pairs(alerts.getWindows()) do
		if v.alert_label.getValue() ~= "DUPLICATE SKILLS" then
			v.close();
		elseif v.alert_label.getValue() == "DUPLICATE SKILLS" then
			bDupeSkillAlert = true;
		end
	end
	if sPage then
		if #aAlerts > 0 then
			for i=1,#aAlerts do
				local wndAlertList = alerts.createWindow();
				wndAlertList.alert_label.setValue(aAlerts[i]);
				self[sPage .. "_alert"].setVisible(true);
				self[sPage .. "_GateCheck"].setValue(0);			
			end
		else
			self[sPage .. "_alert"].setVisible(false);
			self[sPage .. "_GateCheck"].setValue(1);
		end
	end
	if getSkillDuplicates() and not bDupeSkillAlert then
		local wndDupeAlertList = alerts.createWindow();
		wndDupeAlertList.alert_label.setValue("DUPLICATE SKILLS");
	elseif not getSkillDuplicates() then
		for _,v in pairs(alerts.getWindows()) do
			if v.alert_label.getValue() == "DUPLICATE SKILLS" then
				v.close();
			end
		end
	end
end

function updateAbilityAlerts()
	alerts.closeAll();
	local bAbilityCap = false;
	for i=1,6 do
		if summary.subwindow["summary_genval" .. i].getValue() > 20 then
			bAbilityCap = true;
		end
	end
	if bAbilityCap then
		local bAlertWindow = false;
		for _,vAlert in pairs(alerts.getWindows()) do
			if vAlert.alert_label.getValue() == "ABILITY SCORE ABOVE 20" then
				bAlertWindow = true;
			end
		end
		if not bAlertWindow then
			local wndAlertList = alerts.createWindow();
			wndAlertList.alert_label.setValue("ABILITY SCORE ABOVE 20");
			ability_alert.setVisible(true);
			ability_GateCheck.setValue(0);
		end		
	else
		for _,vAlert in pairs(alerts.getWindows()) do
			if vAlert.alert_label.getValue() == "ABILITY SCORE ABOVE 20" then
				vAlert.close();
			end
		end	
		ability_alert.setVisible(false);
		ability_GateCheck.setValue(1);		
	end
	updateGateCheck();
end

function checkExpertise()
	for _,vClass in pairs(CampaignRegistry.charwizard.classes) do
		if vClass.name == "rogue" then
			return true;
		else
			return false;
		end
	end
end

function isSpellCaster(sClassName, nLevel)
	if not sClassName then
		return false;
	end
	if not nLevel then
		nLevel = 1;
	end
	sClassName = string.upper(sClassName);
	local aSpecWindows = summary.subwindow.summary_specialization.getWindows();
	for _,vSpec in pairs(summary.subwindow.summary_specialization.getWindows()) do
		if string.upper(vSpec.classlevel.getValue()) == sClassName then
			sSpecialization = string.upper(vSpec.classname.getValue());
		end
	end
	if sClassName == "BARBARIAN" or sClassName == "MONK"  then
		return false;
	elseif (sClassName == "PALADIN" or sClassName == "RANGER") and tonumber(nLevel) == 1 then
		return false;
	elseif (sClassName == "FIGHTER" or sClassName == "ROGUE") and tonumber(nLevel) < 3 then
		return false;
	elseif sClassName == "FIGHTER" and sSpecialization ~= "ELDRITCH KNIGHT" then
		return false;
	elseif sClassName == "ROGUE" and sSpecialization ~= "ARCANE TRICKSTER" then
		return false;
	else
		return true;
	end
end

function closeSubType(sSubType, sType)
	if sSubType == "languages" or sSubType == "all" then
		local aLangSubType = summary.subwindow.summary_languages.getWindows();
		for _,v in pairs(aLangSubType) do
			if v.type.getValue() == sType then
				v.close();
			end
		end
	end
	if sSubType == "skills" or sSubType == "all" then
		local aSkillSubType = summary.subwindow.summary_skills.getWindows();
		for _,v in pairs(aSkillSubType) do
			if v.type.getValue() == sType then
				v.close();
			end
		end
	end
	if sSubType == "proficiencies" or sSubType == "all" then
		local aProfSubType = summary.subwindow.summary_proficiencies.getWindows();
		for _,v in pairs(aProfSubType) do
			if v.type.getValue() == sType then
				v.close();
			else
				v.name.setVisible(true);
			end
		end
	end	
	if sSubType == "traits" or sSubType == "all" then
		local aTraitSubType = summary.subwindow.summary_traits.getWindows();
		for _,v in pairs(aTraitSubType) do
			if v.type.getValue() == sType then
				v.close();
			end
		end
	end		
end

function getFeats()
	local aFeatCheck = {};	
	local aMappings = LibraryData.getMappings("feat");
	for _,vMapping in ipairs(aMappings) do
		-- If it is a PHB Feat, load it first
		for _,vPHBFeat in pairs(DB.getChildrenGlobal(vMapping)) do	
			local sPHBFeatLower = StringManager.trim(DB.getValue(vPHBFeat, "name", "")):lower();
			local sPHBFeatLink = vPHBFeat.getPath();
			local sPHBPrereq = getPrequisite(DB.getValue(vPHBFeat, "text", ""));
			if string.match(sPHBFeatLink, "DD PHB Deluxe") then
				table.insert(aFeatCheck, {name = sPHBFeatLower, path = sPHBFeatLink, prereq = sPHBPrereq});
			end
		end
		-- Load all other feats ignoring their version of base feats.
		for _,vFeat in pairs(DB.getChildrenGlobal(vMapping)) do	
			local sFeatLower = StringManager.trim(DB.getValue(vFeat, "name", "")):lower();
			local sFeatLink = vFeat.getPath();
			local sPrereq = getPrequisite(DB.getValue(vFeat, "text", ""));			
			if not StringManager.contains(aFeatCheck, sFeatLower) then
				table.insert(aFeatCheck, {name = sFeatLower, path = sFeatLink, prereq = sPrereq});
			end
		end
	end
	return aFeatCheck;
end

function getPrequisite(sText)
	local sPrerequisite = "";
	local aPrerequisite = {};
	if string.match(sText, "Prerequisite:") then
		sPrerequisite = sText:match("Prerequisite: ([^.]+)");

		if not sPrerequisite then
			return false;
		end

		sPrerequisite = sPrerequisite:gsub(" or ", ",");
		sPrerequisite = sPrerequisite:gsub(",%s", ",");
		sPrerequisite = sPrerequisite:gsub(",,", ",");
		sPrerequisite = sPrerequisite:gsub("<(.*)", ""); 

		if sPrerequisite:match("(%d+)") then
			sPrerequisite = sPrerequisite:gsub("%d(.*)", "");
			sPrerequisite = sPrerequisite:gsub("%s", "");			
			return sPrerequisite;
		elseif sPrerequisite:match("Proficiency") then
			return sPrerequisite;
		elseif sPrerequisite:match("cast") then
			return sPrerequisite;
		elseif sPrerequisite:match("Dwarf") then
			return sPrerequisite;
		end
	end
end

function getToolType(sToolType)
	local aTools = {};
	if sToolType and sToolType ~= "" then
		sToolType = string.lower(sToolType);
	end
	local aMappings = LibraryData.getMappings("item");
	for _,vMapping in ipairs(aMappings) do
		for _,vItems in pairs(DB.getChildrenGlobal(vMapping)) do	
			if StringManager.trim(DB.getValue(vItems, "type", "")):lower() == "tools" then
				if sToolType and sToolType ~= "" then
					if StringManager.trim(DB.getValue(vItems, "subtype", "")):lower() == sToolType then
						table.insert(aTools, StringManager.trim(DB.getValue(vItems, "name", "")):lower());
					end
				else
					table.insert(aTools, StringManager.trim(DB.getValue(vItems, "name", "")):lower());
				end
			end
		end
	end
	local aFinalTools = {};
	local aDupes = {};
	for _,v in ipairs(aTools) do
		if not aDupes[v] then
			table.insert(aFinalTools, v);
			aDupes[v] = true;
		end
	end
	return aFinalTools;
end

function updateProficiencies()
	local aCurrentProfs = {};
	local aRaceProfs = {};
	local aClassProfs = {};
	local aFullProfs = {};
	local bAllArmor;
	local bSimpleWeapons;
	local bMartialWeapons;

	summary.subwindow.summary_proficiencies.closeAll();
	local aCurrentProfsWin = summary.subwindow.summary_proficiencies.getWindows();
	
	for _,v in pairs(aCurrentProfsWin) do
		table.insert(aCurrentProfs, string.lower(v.name.getValue()));
	end

	if CampaignRegistry.charwizard.race and CampaignRegistry.charwizard.race.weapons then
		for _,vRaceWeaponProficiency in pairs(CampaignRegistry.charwizard.race.weapons) do
			table.insert(aCurrentProfs, string.lower(vRaceWeaponProficiency));
		end		
	end

	if CampaignRegistry.charwizard.subrace then
		local sRaceClass = CampaignRegistry.charwizard.subrace.class;
		local sRaceRecord = CampaignRegistry.charwizard.subrace.record;
		
		for _,v in pairs(DB.getChildren(DB.findNode(sRaceRecord), "traits")) do
			local sTraitType = CampaignDataManager2.sanitize(DB.getValue(v, "name", ""));

			if sTraitType == "" then
				sTraitType = nodeSource.getName();
			end
			if sTraitType ~= "kenkutraining" and string.match(sTraitType, "training") or sTraitType == "martialprodigy" then
				local sText = DB.getValue(v, "text")
				local sTrainingText = sText:match("You have proficiency with ([^.]+)");
				local sTraining = sTrainingText:gsub("and ", ",");
				sTraining = sTraining:gsub("the ", "");
				for sProf in string.gmatch(sTraining, "(%a[%a%s]+)%,?") do
					if sProf == "light " then
						sProf = "light armor";
					end
					if string.match(sProf, "armor") then
						table.insert(aRaceProfs, string.lower(sProf));
					else
						table.insert(aRaceProfs, string.lower(sProf) .. "s");
					end
				end
			end
		end
	end
	if CampaignRegistry.charwizard.race then
		local sRaceClass = CampaignRegistry.charwizard.race.class;
		local sRaceRecord = CampaignRegistry.charwizard.race.record;
		if CampaignRegistry.charwizard.race.tool then
			table.insert(aFullProfs, CampaignRegistry.charwizard.race.tool);
		end
		if CampaignRegistry.charwizard.race.record then
			for _,v in pairs(DB.getChildren(DB.findNode(CampaignRegistry.charwizard.race.record), "traits")) do
				local sTraitType = CampaignDataManager2.sanitize(DB.getValue(v, "name", ""));

				if sTraitType == "" then
					sTraitType = nodeSource.getName();
				end
				if sTraitType ~= "kenkutraining" and string.match(sTraitType, "training") or sTraitType == "martialprodigy" then
					local sText = DB.getValue(v, "text")
					local sTrainingText = sText:match("You have proficiency with ([^.]+)");
					if not sTrainingText then
						sTrainingText = sText:match("You are proficient with two martial weapons of your choice and with ([^.]+)");
					end
					local sTraining = sTrainingText:gsub("and ", ",");
					sTraining = sTraining:gsub("the ", "");
					for sProf in string.gmatch(sTraining, "(%a[%a%s]+)%,?") do
						if sProf == "light " then
							sProf = "light armor";
						end
						if string.match(sProf, "armor") then
							table.insert(aRaceProfs, string.lower(sProf));
						else
							table.insert(aRaceProfs, string.lower(sProf) .. "s");
						end
					end
				end
			end
			if CampaignRegistry.charwizard.race.subrace then
				for _,v in pairs(DB.getChildren(DB.findNode(CampaignRegistry.charwizard.race.subrace.record), "traits")) do
					local sTraitType = CampaignDataManager2.sanitize(DB.getValue(v, "name", ""));

					if sTraitType == "" then
						sTraitType = nodeSource.getName();
					end
					if sTraitType == "tinker" then
						table.insert(aRaceProfs, "tinker's tools");
					end
					if sTraitType ~= "kenkutraining" and string.match(sTraitType, "training") or sTraitType == "martialprodigy" then
						local sText = DB.getValue(v, "text")
						local sTrainingText = sText:match("You have proficiency with ([^.]+)");
						if not sTrainingText then
							sTrainingText = sText:match("You are proficient with ([^.]+)");
						end
						local sTraining = sTrainingText:gsub("light and ", "light armor,");
						sTraining = sTraining:gsub(" and ", ",");						
						sTraining = sTraining:gsub("the ", "");
						sTraining = sTraining:gsub("with ", "");
						for sProf in string.gmatch(sTraining, "(%a[%a%s]+)%,?") do
							if sProf == "light " then
								sProf = "light armor";
							end
							if string.match(sProf, "armor") then
								table.insert(aRaceProfs, string.lower(sProf));
							else
								sProf = sProf .. "s";
								if string.match(sProf, "crossbow") then
									sProf = sProf:gsub("wss", "ws");
								else
									sProf = sProf:gsub("ss", "s");
								end
								table.insert(aRaceProfs, string.lower(sProf));
							end
						end
					end
				end
			end
		end
	end
	if CampaignRegistry.charwizard.classes then
		for k,v in pairs(CampaignRegistry.charwizard.classes) do
			local sClass = v.class;
			local sRecord = v.record;
			for _,vProf in pairs(DB.getChildren(DB.findNode(sRecord), "proficiencies")) do
				if DB.getValue(vProf, "name", ""):lower() == "weapons" or DB.getValue(vProf, "name", ""):lower() == "armor" or DB.getValue(vProf, "name", ""):lower() == "tools" then
					for sClass in string.gmatch(DB.getValue(vProf, "text", ""), "(%a[%a%s]+)%,?") do
						if string.lower(sClass) ~= "none" then
							if string.lower(sClass) ~= "druids will not wear armor or use shields made of metal" then
								if not string.match(string.lower(sClass), "choose") then
									if not string.match(string.lower(sClass), "musical") then
										if not string.match(string.lower(sClass), "tools") then
											if string.match(string.lower(sClass), "thieves") then
												sClass = "thieves tools";
											end
											table.insert(aClassProfs, string.lower(sClass));
										end
									end
								end
							end
						end
					end
				end
			end
		end
	end

	for _,vProf in pairs(aCurrentProfs) do
		table.insert(aFullProfs, vProf);
	end
	for _,vRaceProf in pairs(aRaceProfs) do
		if not StringManager.contains(aFullProfs, vRaceProf) then
			table.insert(aFullProfs, vRaceProf);
		end
	end
	for _,vClassProf in pairs(aClassProfs) do
		if not StringManager.contains(aFullProfs, vClassProf) then
			if string.lower(vClassProf) == "all simple weapons" then
				vClassProf = "simple weapons";
			end
			table.insert(aFullProfs, vClassProf);
		end
	end
	local aAllArmor = {"light armor", "medium armor", "heavy armor"};
	local aSimpleWeapons = {"clubs", "daggers", "greatclubs", "handaxes", "javelins", "light hammers", "maces", "quarterstaffs", "sickles", "spears", "light crossbows", "darts", "shortbows", "slings", "club", "dagger", "greatclub", "handaxe", "javelin", "light hammer", "mace", "quarterstaff", "sickle", "spear", "light crossbow", "dart", "shortbow", "sling"};
	local aMartialWeapons = {"battleaxe", "flail", "glaive", "greataxe", "greatsword", "halberd", "lance", "longsword", "maul", "morningstar", "pike", "rapier", "scimitar", "shortsword", "trident", "war pick", "warhammer", "whip", "blowgun", "hand crossbow", "heavy crossbow", "longbow", "net", "battleaxes", "flails", "glaives", "greataxes", "greatswords", "halberds", "lances", "longswords", "mauls", "morningstars", "pikes", "rapiers", "scimitars", "shortswords", "tridents", "war picks", "warhammers", "whips", "blowguns", "hand crossbows", "heavy crossbows", "longbows", "nets"};
	for _,v in pairs(aFullProfs) do
		if v == "all armor" then
			bAllArmor = true;
		end
		if v == "all simple weapons" or v == "simple weapons" then
			bSimpleWeapons = true;
		end		
		if v == "martial weapons" then
			bMartialWeapons = true;
		end		
	end
	for _,v in pairs(aFullProfs) do
		if bAllArmor then
			for k,vArmor in pairs(aFullProfs) do
				if StringManager.contains(aAllArmor, vArmor) then
					table.remove(aFullProfs, k);
				end
			end
		end
		if bSimpleWeapons then
			for k,vSimpleWeapon in pairs(aFullProfs) do
				if StringManager.contains(aSimpleWeapons, vSimpleWeapon) or StringManager.contains(aSimpleWeapons, string.sub(vSimpleWeapon, -1)) then
					table.remove(aFullProfs, k);
				end
			end
		end
		if bMartialWeapons then
			for k,vMartialWeapon in pairs(aFullProfs) do
				if StringManager.contains(aMartialWeapons, vMartialWeapon) or StringManager.contains(aSimpleWeapons, string.sub(vMartialWeapon, -1)) then
					table.remove(aFullProfs, k);
				end
			end
		end		
	end

	local aFinalProfs = {};
	local aDupes = {};
	for _,v in ipairs(aFullProfs) do
		if not aDupes[v] then
			table.insert(aFinalProfs, v);
			aDupes[v] = true;
		end
	end
	closeSubType("proficiencies", "all");
	summary.subwindow.summary_proficiencies.closeAll();	
	for _,vList in pairs(aFinalProfs) do
		local wndProfList = summary.subwindow.summary_proficiencies.createWindow();
		wndProfList.name.setValue(StringManager.capitalizeAll(vList));
	end
	summary.subwindow.summary_proficiencies.applySort();
end

function getAvailableLanguages()
	local aLanguages = {};
	local aAvailableLanguages = {};
	local aLangWin = summary.subwindow.summary_languages.getWindows();
	for _,v in pairs(aLangWin) do
		table.insert(aLanguages, v.language.getValue());
	end
	for kLang,_ in pairs(GameSystem.languages) do
		if not StringManager.contains(aLanguages, kLang) then
			table.insert(aAvailableLanguages, kLang);
		end	
	end
	return aAvailableLanguages;
end

function getSkillDuplicates(sPage)
	local aSkillWindows = summary.subwindow.summary_skills.getWindows();
	local aSkillNames = {};
	local aDuplicateSkills = {};	
	local aDupes = {};
	for _,vSkillWin in pairs(aSkillWindows) do
		table.insert(aSkillNames, vSkillWin.name.getValue());
	end
	for _,vSkill in pairs(aSkillNames) do
		if not aDupes[vSkill] then
			aDupes[vSkill] = true;
		else
			table.insert(aDuplicateSkills, vSkill);
		end
	end
	if #aDuplicateSkills > 0 then
		summary.subwindow.summary_skilltitle.setValue("SKILLS (DUPLICATES)");
		return true, aDuplicateSkills;
	else
		summary.subwindow.summary_skilltitle.setValue("SKILLS");
		return false;		
	end
end

function getAvailableSkills()
	local aSkills = {};
	local aAvailableSkills = {};
	local aSkillWin = summary.subwindow.summary_skills.getWindows();
	for _,v in pairs(aSkillWin) do
		table.insert(aSkills, v.name.getValue());
	end
	for kSkill,_ in pairs(DataCommon.skilldata) do
		if not StringManager.contains(aSkills, kSkill) then
			table.insert(aAvailableSkills, kSkill);
		end	
	end

	return aAvailableSkills;
end

function removeAlert(sAlert)
	local aAlertList = alerts.getWindows();

	for i=1,alerts.getWindowCount() do
		if aAlertList then
			if aAlertList[i].alert_label.getValue() == sAlert then
				aAlertList[i].close();
				if alerts.getWindowCount() == 0 then
					race_alert.setVisible(false);
				end
			end
		end
	end
end

function applyRaceStatAdjust(aStatAdjust)
	if not aStatAdjust[1] then
		return false;
	end

	local sAbilityName = "";
	local nAbilityChange = 0;
	local aExclude = {};
	local aSubList = {};
	local sAbility = "";

	for k,v in pairs(aStatAdjust) do
		if v:match("ABILITYCHOOSE") then
			genraces.subwindow.contents.subwindow.label_race_options.setVisible(true);
			genraces.subwindow.contents.subwindow.button_race_options.setVisible(true);
			local wndChoice = genraces.subwindow.contents.subwindow.winlist_race_options.createWindow();
			wndChoice.bname.setText("Choose Ability Increase");
			wndChoice.type.setValue("ABILITYCHOOSE");			
			genraces.subwindow.contents.subwindow.winlist_race_abilityscore_suboptions.closeAll();
			
			local aDashSplit = StringManager.split(v, "-");
			sChoicesAmt = aDashSplit[2] or "";
			local aColonSplit = StringManager.split(sChoicesAmt, ":");
			sSelections = aColonSplit[1] or "";
			sChange = aColonSplit[2] or "";
			if aExclude[1] then
				for _,v1 in pairs(aExclude) do
					for _,v2 in pairs(DataCommon.abilities) do
						if not (v1 == (DataCommon.ability_ltos[v2]):lower()) then
							table.insert(aSubList, v2);
						end
					end
				end
				for _,v in pairs(aSubList) do
					local wndSubChoice = genraces.subwindow.contents.subwindow.winlist_race_abilityscore_suboptions.createWindow();
					wndSubChoice.bname.setText(StringManager.capitalize(v));
					wndSubChoice.type.setValue(sSelections .. "-" .. DataCommon.ability_ltos[v] .. ":" .. sChange);
					wndSubChoice.toggle.setValue("0");
				end
			else
				for _,v in pairs(DataCommon.abilities) do
					local wndSubChoice = genraces.subwindow.contents.subwindow.winlist_race_abilityscore_suboptions.createWindow();
					wndSubChoice.bname.setText(StringManager.capitalize(v));
					wndSubChoice.type.setValue(sSelections .. "-" .. DataCommon.ability_ltos[v] .. ":" .. sChange);
					wndSubChoice.toggle.setValue("0");
				end
			end
		else
			local aColonSplit = StringManager.split(v, ":");
			sAbilityName = (aColonSplit[1] or ""):lower();
			nAbilityChange = tonumber(aColonSplit[2] or "") or 0;
			summary.subwindow["summary_race_" .. sAbilityName].setValue(nAbilityChange);
			table.insert(aExclude, sAbilityName);
			
			if genstats.subwindow then
				genstats.subwindow.contents.subwindow["race_" .. sAbilityName].setValue(nAbilityChange);
			end
		end
	end
	
	if genstats.subwindow then
		for i=1,6 do
			summary.subwindow["summary_genval" .. i].setValue(genstats.subwindow.contents.subwindow["genval" .. i].getValue() + genstats.subwindow.contents.subwindow["race_" .. (DataCommon.ability_ltos[DataCommon.abilities[i]]):lower()].getValue());
		end
	end
end

function createSuboptions(sType, sWindow)
	if string.match(sType, "SKILLCHOOSE") then
		for _,v in pairs(getAvailableSkills()) do
			local wndSubChoice;
			if sWindow == "background" then
				wndSubChoice = genclass.subwindow.contents.subwindow.winlist_background_skill_suboptions.createWindow();
			else
				wndSubChoice = genraces.subwindow.contents.subwindow.winlist_race_skill_suboptions.createWindow();
			end
			wndSubChoice.bname.setText(StringManager.capitalize(v));
			wndSubChoice.name.setValue(StringManager.capitalize(v));
			wndSubChoice.type.setValue("2-SKILLCHOOSE");
			wndSubChoice.toggle.setValue("0");
		end
	end	
	if sType == "LANGCHOOSE" then
		for _,v in pairs(getAvailableLanguages()) do
			local wndSubChoice;
			if sWindow == "background" then
				wndSubChoice = genclass.subwindow.contents.subwindow.winlist_background_language_suboptions.createWindow();
			else
				wndSubChoice = genraces.subwindow.contents.subwindow.winlist_race_language_suboptions.createWindow();
			end
			--wndSubChoice.closeAll();
			wndSubChoice.bname.setText(StringManager.capitalize(v));
			wndSubChoice.name.setValue(StringManager.capitalize(v));
			wndSubChoice.type.setValue("LANGCHOOSE");
			wndSubChoice.toggle.setValue("0");
		end
	end
	if sType == "TOOLCHOOSE" then
		if sWindow == "background" then		
			for _,v in pairs(genclass.subwindow.contents.subwindow.winlist_background_options.getWindows()) do
				if v.type.getValue() == "TOOLCHOOSE" then
					aTools = {};
					i = 1;
					for v in string.gmatch(v.name.getValue(), "([^,]+)") do 
						aTools[i] = v
						i = i + 1
					end
					for _,v in pairs(aTools) do
						wndSubChoice = genclass.subwindow.contents.subwindow.winlist_background_tool_suboptions.createWindow();
						wndSubChoice.bname.setText(StringManager.capitalize(v));
						wndSubChoice.name.setValue(StringManager.capitalize(v));
						wndSubChoice.type.setValue("TOOLCHOOSE");
						wndSubChoice.toggle.setValue("0");
					end	
				end
			end
		else
			for _,v in pairs(genraces.subwindow.contents.subwindow.winlist_race_options.getWindows()) do
				if v.type.getValue() == "TOOLCHOOSE" then
					aTools = {};
					i = 1;
					for v in string.gmatch(v.name.getValue(), "([^,]+)") do 
						aTools[i] = v
						i = i + 1
					end
					for _,v in pairs(aTools) do
						wndSubChoice = genraces.subwindow.contents.subwindow.winlist_race_tool_suboptions.createWindow();
						wndSubChoice.bname.setText(StringManager.capitalize(v));
						wndSubChoice.name.setValue(StringManager.capitalize(v));
						wndSubChoice.type.setValue("TOOLCHOOSE");
						wndSubChoice.toggle.setValue("0");
					end	
				end
			end
		end
	end	
end

function setClassLevel(sClass, sLevel, sClassRecord)
	local wndClassList = summary.subwindow.summary_class.getWindows();
	local nClassListCount = summary.subwindow.summary_class.getWindowCount();
	if nClassListCount > 0 then
		for _,vClassWindow in pairs(wndClassList) do
			if string.upper(vClassWindow.classname.getValue()) == string.upper(sClass) then
				vClassWindow.classlevel.setValue(sLevel);
			end
		end
	end
end

function setClassList(sClassName, sLevel, sClass, sRecord)
	local wndClassList = summary.subwindow.summary_class.getWindows();
	local nClassListCount = summary.subwindow.summary_class.getWindowCount();
	local bNewClass = false;
	if nClassListCount > 0 then
		for _,v in pairs(wndClassList) do
			if string.upper(sClassName) == string.upper(v.classname.getValue()) then
				genclass.subwindow.contents.subwindow.class_level.setValue(v.classlevel.getValue());
				bNewClass = false;
				break;
			else
				bNewClass = true;
			end
		end
	else
		local wndAddClass = summary.subwindow.summary_class.createWindow();
		wndAddClass.classname.setValue(string.upper(sClassName));
		wndAddClass.classlevel.setValue(1);
		wndAddClass.classlink.setValue(sClassRecord);
	end
	if bNewClass then
		local wndAddClass = summary.subwindow.summary_class.createWindow();
		wndAddClass.classname.setValue(string.upper(sClassName));
		wndAddClass.classlevel.setValue(1);
		wndAddClass.classlink.setValue(sClassRecord);
		genclass.subwindow.contents.subwindow.class_level.setValue(1);		
	end
end

function raceSelect(sRecord, bSubrace)
	if not bSubrace then
		summary.subwindow.summary_size.setValue("");
		summary.subwindow.summary_speed.setValue("");
		summary.subwindow.summary_speedspecial.setValue("");
		summary.subwindow.summary_senses.setValue("");
		
		closeSubType("language", "race");
		
		for _,v in pairs(DataCommon.ability_ltos) do
			summary.subwindow["summary_race_" .. (v):lower()].setValue(0);
			if genstats.subwindow then
				genstats.subwindow.contents.subwindow["race_" .. (v):lower()].setValue(0);
			end
		end
	end

	local aRaceAbilities = {};
	for _,v in pairs(sRecord, "traits") do
		local sTraitType = CampaignDataManager2.sanitize(DB.getValue(v, "name", ""));
		aRaceAbilities = parseRacialTrait("reference_racialtrait", v);
		if string.match(sTraitType, "weapontraining") then
			parseWeapons(v, "race");
		end
		local sSkillText = DB.getValue(v, "text");
		if string.match(sSkillText, "skill") then
			parseSkills(v, "race");
		end
	end
	applyRaceStatAdjust(aRaceAbilities);	
end

function getClassSpecializationOptions(nodeClass)
	local aOptions = {};
	for _,v in pairs(DB.getChildrenGlobal(nodeClass, "abilities")) do
		table.insert(aOptions, { text = DB.getValue(v, "name", ""), linkclass = "reference_classability", linkrecord = v.getPath() });
	end
	return aOptions;
end

function parseSkills(nodeSource, sWindow)
	if not nodeSource then
		return
	end
	
	local sText = DB.getValue(nodeSource, "text")
	local sSkillText = sText:match("You have proficiency in the ([^.]+)");
	if not sSkillText then
		sSkillText = sText:match("You gain proficiency in the ([^.]+)");
	end
	if sSkillText then
		local sSkills = sSkillText:gsub("and ", ",");
		sSkills = sSkills:gsub(" skill.", "");
		sSkills = sSkills:gsub(" skill", "");		
	
		for s in string.gmatch(sSkills, "(%a[%a%s]+)%,?") do
			local wndSkillList = summary.subwindow.summary_skills.createWindow();
			wndSkillList.name.setValue(StringManager.capitalize(s));
			wndSkillList.type.setValue(sWindow);
			summary.subwindow.summary_skills.applySort();
		end
	end
end

function parseTools(nodeSource, sWindow)
	if not nodeSource then
		return
	end
	
	local sText = DB.getValue(nodeSource, "text")
	local sToolText = sText:match("type of ([^.]+)");
	local sTools = sToolText:gsub("and ", ",");
	sTools = sTools:gsub("the ", "");
	sTools = sTools:gsub("one ", "");

	for s in string.gmatch(sTools, "(%a[%a%s]+)%,?") do
		local wndToolList = summary.subwindow.summary_proficiencies.createWindow();
		wndToolList.name.setValue(StringManager.capitalize(s));
		wndToolList.type.setValue(sWindow);			
	end
end

function parseWeapons(nodeSource, sWindow)
	if not nodeSource then
		return
	end
	
	local sText = DB.getValue(nodeSource, "text")
	local sWeaponText = sText:match("You have proficiency with ([^.]+)");
	local sWeapons = sWeaponText:gsub("and ", ",");
	sWeapons = sWeapons:gsub("the ", "");

	for s in string.gmatch(sWeapons, "(%a[%a%s]+)%,?") do
		local wndWeaponList = summary.subwindow.summary_proficiencies.createWindow();
		wndWeaponList.name.setValue(StringManager.capitalize(s));
		wndWeaponList.type.setValue(sWindow);			
	end

end

function parseAbilityImprovement(nodeSource, nLevel, sClassName)
	if not nodeSource then
		return
	end

	for _,v in pairs(DB.getChildren(nodeSource, "features")) do
		local sFeatureName = DB.getValue(v, "name", "");
		if (DB.getValue(v, "level", 0) == nLevel) and sFeatureName == "Ability Score Improvement" then
			local nFeatureLevel = DB.getValue(v, "level", 0);
			genclass.subwindow.contents.subwindow.label_class_options.setVisible(true);
			genclass.subwindow.contents.subwindow.button_class_options.setVisible(true);
			wndOptionChoice1 = genclass.subwindow.contents.subwindow.winlist_class_options.createWindow();
			wndOptionChoice1.bname.setText("Increase Ability: " .. StringManager.capitalize(sClassName) .. " " .. nFeatureLevel);
			wndOptionChoice1.name.setValue("impabilitychoice" .. sClassName .. nFeatureLevel);
			wndOptionChoice1.type.setValue("IMPABILITYCHOOSE" .. sClassName .. nFeatureLevel);
			wndOptionChoice1.link.setValue(DB.getValue(v, "linkrecord", ""));
			wndOptionChoice2 = genclass.subwindow.contents.subwindow.winlist_class_options.createWindow();
			wndOptionChoice2.bname.setText("Choose Feat: " .. StringManager.capitalize(sClassName) .. " " .. nFeatureLevel);
			wndOptionChoice2.name.setValue("featchoice" .. sClassName .. nFeatureLevel);
			wndOptionChoice2.type.setValue("IMPFEATCHOOSE" .. sClassName .. nFeatureLevel);

			if genclass.subwindow.contents.subwindow.winlist_class_abilityimp_suboptions.getWindowCount() == 0 then			
				for _,v in pairs(DataCommon.abilities) do
					local wndSubChoice = genclass.subwindow.contents.subwindow.winlist_class_abilityimp_suboptions.createWindow();
					wndSubChoice.bname.setText(StringManager.capitalize(v));
					wndSubChoice.name.setValue(v .. "-" .. sClassName .. nFeatureLevel);
					wndSubChoice.type.setValue("IMPABILITYCHOOSE" .. sClassName .. nFeatureLevel);
					wndSubChoice.toggle.setValue("0");
				end
			end
		end
	end
end

function setImpAbilitySubOptions(sClassLevel)
	local sLevel = string.match(sClassLevel, "%d+");
	local sClassName = string.gsub(sClassLevel, sLevel, "");
	
	genclass.subwindow.contents.subwindow.winlist_class_abilityimp_suboptions.closeAll();
	for _,v in pairs(DataCommon.abilities) do
		local wndSubChoice = genclass.subwindow.contents.subwindow.winlist_class_abilityimp_suboptions.createWindow();
		wndSubChoice.bname.setText(StringManager.capitalize(v));
		wndSubChoice.name.setValue(v .. "-" .. sClassName .. sLevel);
		wndSubChoice.type.setValue("IMPABILITYCHOOSE" .. sClassName .. sLevel);
		wndSubChoice.toggle.setValue("0");
	end
end

function parseBackground(nodeSource)
	local sSkillText = DB.getValue(nodeSource, "text");
	local sSkills = string.match(sSkillText, "Skill:(.+)Tool:");
	if not sSkills then
		sSkills = string.match(sSkillText, "Skill:(.+)Languages:");
	end
	if not sSkills then
		sSkills = string.match(sSkillText, "Skill:(.+)Language:");
	end
	if not sSkills then
		sSkills = string.match(sSkillText, "Skill Proficiencies:(.+)Tool Proficiencies:");
	end
	if not sSkills then
		sSkills = string.match(sSkillText, "Skill:(.+)Features");
	end
	if not string.match(sSkills, "Choose") then
		sSkills = string.gsub(sSkills, "</b>", "");
		sSkills = string.gsub(sSkills, "</p><p><b>", "");
		sSkills = string.gsub(sSkills, "and ", "");
		sSkills = string.gsub(sSkills, "plus(.+)", "");
		sSkills = string.gsub(sSkills, "one(.+)", "");		
		for s in string.gmatch(sSkills, "(%a[%a%s]+)%,?") do
			local wndSkillList = summary.subwindow.summary_skills.createWindow();
			wndSkillList.name.setValue(StringManager.capitalize(s));
			wndSkillList.type.setValue("background");
			summary.subwindow.summary_skills.applySort();			
		end
	end
	if string.match(sSkillText, "Choose") or string.match(sSkillText, "choice") then
		genclass.subwindow.contents.subwindow.label_background_options.setVisible(true);
		genclass.subwindow.contents.subwindow.button_background_options.setVisible(true);
		local wndChoice = genclass.subwindow.contents.subwindow.winlist_background_options.createWindow();
		wndChoice.bname.setText("Choose Skill");
		wndChoice.type.setValue("SKILLCHOOSE");
		createSuboptions("SKILLCHOOSE", "background");
	end

	local sTools = DB.getValue(nodeSource, "tool", "");
	local sText = DB.getText(nodeSource, "text");
	local sToolChoices = sText:match("choice: ([^.]+)");	
	local sToolText = sText:match("Tool:(.+)\n");
	if sTools ~= "" and sTools ~= "None" then
		genclass.subwindow.contents.subwindow.label_background_options.setVisible(true);
		genclass.subwindow.contents.subwindow.button_background_options.setVisible(true);
		local wndChoice = genclass.subwindow.contents.subwindow.winlist_background_options.createWindow();
		wndChoice.bname.setText("Choose Tool");
		wndChoice.type.setValue("TOOLCHOOSE");
		createSuboptions("TOOLCHOOSE", "background");		
	end
	
	local sLanguages = DB.getValue(nodeSource, "languages", "");
	if sLanguages ~= "" and sLanguages ~= "None" then
		genclass.subwindow.contents.subwindow.label_background_options.setVisible(true);
		genclass.subwindow.contents.subwindow.button_background_options.setVisible(true);
		local wndChoice = genclass.subwindow.contents.subwindow.winlist_background_options.createWindow();
		wndChoice.bname.setText("Choose Language");
		wndChoice.type.setValue("LANGCHOOSE");
		createSuboptions("LANGCHOOSE", "background");		
	end
end

function parseRacialTrait(sClass, sRecord)
	local nodeSource = sRecord;
	if not nodeSource then
		return;
	end

	local sTraitType = CampaignDataManager2.sanitize(DB.getValue(nodeSource, "name", ""));
	if sTraitType == "" then
		sTraitType = nodeSource.getName();
	end

	local resultArray = {};

	if sTraitType == "size" then
		local sSize = DB.getText(nodeSource, "text");
		sSize = sSize:match("[Yy]our size is (%w+)");
		if not sSize then
			sSize = "Medium";
		end
		summary.subwindow.summary_size.setValue(StringManager.capitalize(sSize));		

	elseif sTraitType == "speed" then
		local sSpeed = DB.getText(nodeSource, "text");
		
		local sWalkSpeed = sSpeed:match("(%d+)");
		if not sWalkSpeed then
			sWalkSpeed = sSpeed:match("land speed is (%d+) feet");
		elseif not sWalkSpeed then
			sWalkSpeed = sSpeed:match("(%d+)");
		end
		if sWalkSpeed then
			local nSpeed = tonumber(sWalkSpeed) or 30;
			summary.subwindow.summary_speed.setValue(nSpeed);
		end
		
		local aSpecial = {};
		local bSpecialChanged = false;
		local sSpecial = StringManager.trim(DB.getValue(nodeChar, "speed.special", ""));
		if sSpecial ~= "" then
			table.insert(aSpecial, sSpecial);
		end
		
		local sSwimSpeed = sSpeed:match("swimming speed of (%d+) feet");
		if sSwimSpeed then
			bSpecialChanged = true;
			table.insert(aSpecial, "Swim " .. sSwimSpeed .. " ft.");
		end

		local sFlySpeed = sSpeed:match("flying speed of (%d+) feet");
		if sFlySpeed then
			bSpecialChanged = true;
			table.insert(aSpecial, "Fly " .. sFlySpeed .. " ft.");
		end

		local sClimbSpeed = sSpeed:match("climbing speed of (%d+) feet");
		if sClimbSpeed then
			bSpecialChanged = true;
			table.insert(aSpecial, "Climb " .. sClimbSpeed .. " ft.");
		end
		
		if bSpecialChanged then
			summary.subwindow.summary_speedspecial.setValue(table.concat(aSpecial, ", "));
		end

	elseif sTraitType == "flight" or sTraitType == "winged" then
		local sFlight = DB.getText(nodeSource, "text");		
		local sFlightSpeed = sFlight:match("(%d+)");
		if sFlightSpeed then	
			local sFlySpeed = tonumber(sFlightSpeed) or 30;
			summary.subwindow.summary_speedspecial.setValue("Fly " .. sFlySpeed .. " ft.");
		end
		
	elseif sTraitType == "swim" then
		local sSwim = DB.getText(nodeSource, "text");		
		local sSpeed = sSwim:match("(%d+)");
		if sSpeed then	
			local sSwimSpeed = tonumber(sFlightSpeed) or 30;
			summary.subwindow.summary_speedspecial.setValue("Swim " .. sSwimSpeed .. " ft.");
		end
		
	elseif sTraitType == "darkvision" then
		local sSenses = DB.getText(nodeSource, "text");		
		local sDarkVision = sSenses:match("(%d+)");
		if sDarkVision then
			local nDist = tonumber(sDarkVision) or 60;
			summary.subwindow.summary_senses.setValue("Darkvision " .. nDist);
		end
	elseif sTraitType == "superiordarkvision" then
		local sSenses = DB.getText(nodeSource, "text");		
		local sDarkVision = sSenses:match("(%d+)");
		if sDarkVision then
			local nDist = tonumber(sDarkVision) or 120;
			summary.subwindow.summary_senses.setValue("Superior Darkvision " .. nDist);
		end
	elseif sTraitType == "languages" or sTraitType == "language" then
		local bApplied = false;
		local sText = DB.getText(nodeSource, "text");
		local sLanguages = sText:match("You can speak, read, and write ([^.]+)");
		if not sLanguages then
			sLanguages = sText:match("You can read and write ([^.]+)");
		end
		if not sLanguages then
			return false;
		end

		sLanguages = sLanguages:gsub("and ", ",");
		sLanguages = sLanguages:gsub("one extra language of your choice", "Choice");
		sLanguages = sLanguages:gsub("one other language of your choice", "Choice");
		-- EXCEPTION - Kenku - Languages - Volo
		sLanguages = sLanguages:gsub(", but you.*$", "");
		if sLanguages:match("Choice") then
			genraces.subwindow.contents.subwindow.label_race_options.setVisible(true);
			genraces.subwindow.contents.subwindow.button_race_options.setVisible(true);
			local wndChoice = genraces.subwindow.contents.subwindow.winlist_race_options.createWindow();
			wndChoice.bname.setText("Choose Language");
			wndChoice.type.setValue("LANGCHOOSE");
			createSuboptions("LANGCHOOSE");
		end
		for s in string.gmatch(sLanguages, "(%a[%a%s]+)%,?") do
			if not s:match("Choice") then
				local wndLangList = summary.subwindow.summary_languages.createWindow();
				wndLangList.language.setValue(StringManager.capitalize(s));
				wndLangList.type.setValue("race");
				summary.subwindow.summary_languages.applySort();
				bApplied = true;
			end
		end
		return bApplied;		
	elseif sTraitType == "fleetoffoot" then
		local sFleetOfFoot = DB.getText(nodeSource, "text");
		
		local sWalkSpeedIncrease = sFleetOfFoot:match("walking speed increases to (%d+) feet");
		if sWalkSpeedIncrease then
			--DB.setValue(nodeChar, "speed.base", "number", tonumber(sWalkSpeedIncrease));
		end

	elseif sTraitType == ("toolproficiency") then
		local bApplied = false;
		local sText = DB.getText(nodeSource, "text");
		local sTools = sText:match("choice: ([^.]+)");

		if not sTools then
			return false;
		end

		sTools = sTools:gsub(" or ", ",");
		sTools = sTools:gsub(",%s", ",");
		sTools = sTools:gsub(",,", ",");
		genraces.subwindow.contents.subwindow.label_race_options.setVisible(true);
		genraces.subwindow.contents.subwindow.button_race_options.setVisible(true);
		local wndChoice = genraces.subwindow.contents.subwindow.winlist_race_options.createWindow();
		wndChoice.bname.setText("Choose Tool Proficiency");
		wndChoice.name.setValue(sTools);
		wndChoice.type.setValue("TOOLCHOOSE");
		createSuboptions("TOOLCHOOSE");
		return bApplied;				
	elseif sTraitType == "alignment" then
		return false;
	elseif sTraitType == "age" then
		return false;
	elseif sTraitType == "subrace" then
		return false;		
	
	elseif sTraitType == "abilityscoreincrease" or sTraitType == "abilityscoreincreases" then
		local bApplied = false;
		local sAdjust = DB.getText(nodeSource, "text"):lower();
		
		if sAdjust:match("your ability scores each increase") then

			-- Ex: "ABILITY:1:STR", "ABILITY:1:DEX", "ABILITY:1:CON", "ABILITY:1:INT", "ABILITY:1:WIS", "ABILITY:1:CHA"
			for k,v in pairs(DataCommon.abilities) do
				table.insert(resultArray, DataCommon.ability_ltos[v] .. ":" .. 1);
			end
		else
			local aIncreases = {};
			
			local n1, n2;
			local a1, a2, sIncrease = sAdjust:match("your (%w+) and (%w+) scores increase by (%d+)");
			if not a1 then
				a1, a2, sIncrease = sAdjust:match("your (%w+) and (%w+) scores both increase by (%d+)");
			end
			if a1 then
				local nIncrease = tonumber(sIncrease) or 0;
				aIncreases[a1] = nIncrease;
				aIncreases[a2] = nIncrease;
			else
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
				table.insert(resultArray, DataCommon.ability_ltos[k] .. ":" .. v);
			end
			
			sIncrease = sAdjust:match("two different ability scores of your choice increase by (%d+)")
			if sIncrease then
				-- Ex: ABILITYCHOOSE:2:1  (Choose 2 different abilities to gain 1 point)
				local nAbilityAdj = tonumber(sIncrease) or 1;
				table.insert(resultArray, "ABILITYCHOOSE-2:" .. nAbilityAdj);
				addAlert("RACE: ABILITY CHOICES NOT MADE", 240, 1);
			else
				sIncrease = sAdjust:match("one ability score of your choice increases by (%d+)");
				if sIncrease then
					-- Ex: ABILITYCHOOSE:1:2  (Choose 1 ability to gain 2 points)
					local nAbilityAdj = tonumber(sIncrease) or 1;
					bApplied = true;
				else
					sIncrease = sAdjust:match("one other ability score of your choice increases by (%d+)");
					if sIncrease then
						local aAbilities = {};
						for _,v in ipairs(DataCommon.abilities) do
							if not aIncreases[v] then
								table.insert(aAbilities, StringManager.capitalize(v));
							end
						end
						if #aAbilities > 0 then
							-- Ex: ABILITYCHOOSE:1:1:STR,DEX,CON  (Choose one of (STR,DEX,CON) to gain 1 point)
							local nAbilityAdj = tonumber(sIncrease) or 1;
							bApplied = true;
						end
					else
						sIncrease = sAdjust:match("two other ability scores of your choice increase by (%d+)");
						if sIncrease then
							local aAbilities = {};
							for _,v in ipairs(DataCommon.abilities) do
								if not aIncreases[v] then
									table.insert(aAbilities, StringManager.capitalize(v));
								end
							end
							if #aAbilities > 0 then
								local nAbilityAdj = tonumber(sIncrease) or 1;
								table.insert(resultArray, "ABILITYCHOOSE-2:" .. nAbilityAdj);
								addAlert("RACE: ABILITY CHOICES NOT MADE", 240, 1);								
								bApplied = true;
							end
						else
							a1, a2, sIncrease = sAdjust:match("either your (%w+) or your (%w+) increases by (%d+)");
							if a1 then
								local aAbilities = {};
								for _,v in ipairs(DataCommon.abilities) do
									if (v == a1) or (v == a2) then
										table.insert(aAbilities, StringManager.capitalize(v));
									end
								end
								if #aAbilities > 0 then
									local nAbilityAdj = tonumber(sIncrease) or 1;
									bApplied = true;
								end
							end
						end
					end
				end
			end
		end
	else
		local wndLangList = summary.subwindow.summary_traits.createWindow();
		wndLangList.name.setValue(DB.getValue(sRecord, "name"));
		wndLangList.type.setValue("race");
		summary.subwindow.summary_traits.applySort();		
	end

	applyRaceStatAdjust(resultArray);
	return resultArray;
end

function requestResponse(result, identity)
	commitCharacter(identity);
end

function requestCommit(identity)
	if not bRequested then
		User.requestIdentity(nil, "charsheet", "name", nil, requestResponse);
		bRequested = true;
	end


	if User.isLocal() then
		Interface.openWindow("charsheet", User.createLocalIdentity());
	else
		if not bRequested then
			User.requestIdentity(nil, "charsheet", "name", nil, requestResponse);
			bRequested = true;
		end
	end
end	

function commitCharacter(identity)
	local nodeChar;
	local w;	
	if CampaignRegistry.charwizard.import then
		nodeChar = DB.findNode(summary.subwindow.summary_identity.getValue());
		w = Interface.openWindow("charsheet", nodeChar);

		-- Update Ability Scores
		local aDBAbilities = {};
		for kDBAbility, vDBScore in pairs(DB.getChildren(nodeChar, "abilities")) do
			aDBAbilities[kDBAbility] = DB.getValue(vDBScore, "score", 0);
		end
		for k,v in ipairs(DataCommon.abilities) do
			if aDBAbilities[v] ~= summary.subwindow["summary_genval" .. k].getValue() then
				local nMaxScore = 20;
				local nAdjustedScore = summary.subwindow["summary_genval" .. k].getValue() - aDBAbilities[v];
				if nAdjustedScore < 0 then
					nMaxScore = nil;
				end	
				addAbilityAdjustment(nodeChar, v, nAdjustedScore, nMaxScore);
			end
		end

		-- Update Class Text and Link
		local aLUClassList = CampaignRegistry.charwizard.classes;
		local aDBClassList = DB.getChildren(nodeChar, "classes");
		local aClassNames = {};
		local nHitPoints = 0;
		local bNewClass = false;
		for _,vDBClass in pairs(aDBClassList) do
			for _,vLUClass in pairs(aLUClassList) do
				if vLUClass.name == string.lower(DB.getValue(vDBClass, "name", "")) then
					table.insert(aClassNames, vLUClass.name);
					if tonumber(vLUClass.level) ~= tonumber(DB.getValue(vDBClass, "level", "")) then
						local sClassRef = vLUClass.class;
						local sClassRecord = vLUClass.record;
						local nClassLevel = tonumber(vLUClass.level);
						local sSpecialization = vLUClass.spec;
						updateHitPoints(nodeChar, sClassRef, sClassRecord, nClassLevel);
						addFeatures(nodeChar, DB.findNode(sClassRecord), tonumber(DB.getValue(vDBClass, "level", "")), nClassLevel, sSpecialization, sClassRef);
						DB.setValue(vDBClass, "level", "number", tonumber(vLUClass.level));
					end
				end
			end
		end
		for _,vCRClass in pairs(aLUClassList) do
			if not StringManager.contains(aClassNames, vCRClass.name) then
				local sClassRef = vCRClass.class;
				local sClassRecord = vCRClass.record;
				local nClassLevel = tonumber(vCRClass.level);
				local sSpecialization = vCRClass.spec;
				addClassRef(nodeChar, sClassRef, sClassRecord, nClassLevel);
				addFeatures(nodeChar, DB.findNode(sClassRecord), 0, nClassLevel, sSpecialization, sClassRef)				
			end
		end
		
		-- Update Inventory
		if CampaignRegistry.charwizard.inventorylist then
			for _,vItem in pairs(CampaignRegistry.charwizard.inventorylist) do
				addItemToList("charsheet." .. nodeChar.getName() .. ".inventorylist", "reference_equipment", vItem.record, true, vItem.count)
			end
		end
		calcItemArmorClass(nodeChar);

		-- Update Spell Slots
		local nSpellCasterLevel = calcSpellcastingLevel();
		local nPactCasterLevel = calcPactMagicLevel();
		local nSpellClassLevels = 0;
		local nPactClassLevels = 0;
		local bHybrid = false;
		if nSpellCasterLevel > 0 or nPactCasterLevel > 0 then
			for _,vClass in pairs (CampaignRegistry.charwizard.classes) do
				if vClass.name == "paladin" or vClass.name == "ranger" and #CampaignRegistry.charwizard.impclasses == 1 then
					bHybrid = true;
				end
				if vClass.spellcaster and vClass.spellcaster == 1 then
					nSpellClassLevels = nSpellClassLevels + tonumber(vClass.level);
				elseif vClass.spellcaster and vClass.spellcaster == 2 then
					if bHybrid then
						if tonumber(vClass.level) > 1 then
							nSpellClassLevels = nSpellClassLevels + math.ceil(tonumber(vClass.level) / 2);
						end
					else
						nSpellClassLevels = nSpellClassLevels + math.floor(tonumber(vClass.level) / 2);
					end
				elseif vClass.spellcaster and vClass.spellcaster == 3 then
					nSpellClassLevels = nSpellClassLevels + math.floor(tonumber(vClass.level) / 3);				
				elseif vClass.spellcaster and vClass.spellcaster == 4 then
					nPactClassLevels = tonumber(vClass.level);
				elseif vClass.spellcaster and vClass.spellcaster == 5 then
					nSpellClassLevels = math.ceil(tonumber(vClass.level) / 2);
				end
			end
			addSpellSlots(nodeChar, nSpellClassLevels, nPactClassLevels, bHybrid);
		end

		-- Add New Spells
		if CampaignRegistry.charwizard.spelllist then
			for _,vSpell in pairs (CampaignRegistry.charwizard.spelllist) do
				local sSource = vSpell.source;
				if sSource then
					sSource = StringManager.capitalize(sSource);
				end
				local sSpellClass = vSpell.class;
				local sSpellRecord = vSpell.record;
				local sSpellName = DB.getValue(DB.findNode(sSpellRecord), "name", "");
				if sSpellRecord and sSpellRecord ~= "" and sSpellRecord ~= "reference_spell" then
					PowerManager.addPower(sSpellClass, sSpellRecord, nodeChar, "Spells (" .. sSource .. ")");
					outputUserMessage("char_abilities_message_spelladd", sSpellName, DB.getValue(nodeChar, "name", ""));
				end
			end
		end

		-- Add New Feats
		if CampaignRegistry.charwizard.feats then
			for _,vFeats in pairs (CampaignRegistry.charwizard.feats) do
				if CampaignRegistry.charwizard.feats.race then
					local sRaceFeatRecord = CampaignRegistry.charwizard.feats.race;
					addFeatDB(nodeChar, "reference_feat", sRaceFeatRecord);				
				end
				if CampaignRegistry.charwizard.feats.class then
					for _,vCRFeat in pairs(CampaignRegistry.charwizard.feats.class) do
						local sClassFeatRecord = vCRFeat.record;
						if sClassFeatRecord ~= "" then
							addFeatDB(nodeChar, "reference_feat", sClassFeatRecord);
						end
					end
				end			
			end
		end

	else
	
		if User.isHost() or User.isLocal() then
			nodeChar = DB.createChild("charsheet");
			w = Interface.openWindow("charsheet", nodeChar);
		else
			nodeChar = DB.findNode("charsheet." .. identity);
			w = Interface.findWindow("charsheet", nodeChar);
		end

		-- Set Name
		if name.getValue() ~= "" then
			w.name.setValue(name.getValue());
		end

		-- Set Speed
		DB.setValue(nodeChar, "speed.base", "number", summary.subwindow.summary_speed.getValue());
		DB.setValue(nodeChar, "speed.special", "string", summary.subwindow.summary_speedspecial.getValue());
		
		-- Set Senses
		DB.setValue(nodeChar, "senses", "string", summary.subwindow.summary_senses.getValue());

		-- Set Size
		DB.setValue(nodeChar, "size", "string", summary.subwindow.summary_size.getValue());
		
		-- Set Ability Scores
		for k,v in ipairs(DataCommon.abilities) do
			local nMaxScore = 20;
			local nAdjustedScore = summary.subwindow["summary_genval" .. k].getValue() - 10;
			if nAdjustedScore < 0 then
				nMaxScore = nil;
			end	
			addAbilityAdjustment(nodeChar, v, nAdjustedScore, nMaxScore);
		end	

		-- Set Background Text and Link
		local sBackgroundClass = CampaignRegistry.charwizard.background.class;
		local sBackgroundRecord = CampaignRegistry.charwizard.background.record;	
		addBackgroundRef(nodeChar, sBackgroundClass, sBackgroundRecord);
		
		-- Set Race or Subrace Text and Link
		if CampaignRegistry.charwizard.race.subrace then
			sSubTraitClass = CampaignRegistry.charwizard.race.subrace.class;
			sSubTraitRecord = CampaignRegistry.charwizard.race.subrace.record;
			sRaceTraitClass = CampaignRegistry.charwizard.race.class;
			sRaceTraitRecord = CampaignRegistry.charwizard.race.record;

			local nodeSource = resolveRefNode(sSubTraitRecord);
			if not nodeSource then
				return;
			end	

			addTraitsDB(nodeChar, sRaceTraitClass, sRaceTraitRecord);
			addTraitsDB(nodeChar, sSubTraitClass, sSubTraitRecord);
			DB.setValue(nodeChar, "race", "string", DB.getValue(nodeSource, "name", ""));
			DB.setValue(nodeChar, "racelink", "windowreference", sRaceTraitClass, sRaceTraitRecord);		
		else
			sRaceTraitClass = CampaignRegistry.charwizard.race.class;
			sRaceTraitRecord = CampaignRegistry.charwizard.race.record;
			local nodeSource = resolveRefNode(sRaceTraitRecord);
			if not nodeSource then
				return;
			end
			addTraitsDB(nodeChar, sRaceTraitClass, sRaceTraitRecord);
			DB.setValue(nodeChar, "race", "string", DB.getValue(nodeSource, "name", ""));
			DB.setValue(nodeChar, "racelink", "windowreference", sRaceTraitClass, sRaceTraitRecord);		
		end

		-- Move Listed Languages, Skills, and Proficiencies to Character DB
		addLanguagesDB(nodeChar);
		addProficiencyDB(nodeChar);
		addSkillDB(nodeChar);

		-- Set Class Text and Link
		local aClassList = CampaignRegistry.charwizard.classes;
		for _,v in pairs(aClassList) do
			local sClassRef = v.class;
			local sClassRecord = v.record;
			local nClassLevel = tonumber(v.level);
			local sSpecialization = v.spec;
			addClassRef(nodeChar, sClassRef, sClassRecord, nClassLevel);
			addFeatures(nodeChar, DB.findNode(sClassRecord), 0, nClassLevel, sSpecialization, sClassRef);
			if v.main then
				addSaveProf(nodeChar, v.class, v.record);
			end
		end
		local nTotalHP = 0;
		for _,vHP in pairs(aClassList) do
			nTotalHP = nTotalHP + vHP.HP;
		end	
		DB.setValue(nodeChar, "hp.total", "number", nTotalHP);

		-- Add Inventory
		if CampaignRegistry.charwizard.inventorylist then
			for _,vItem in pairs(CampaignRegistry.charwizard.inventorylist) do
				addItemToList("charsheet." .. nodeChar.getName() .. ".inventorylist", "reference_equipment", vItem.record, true, vItem.count)
			end
		end
		calcItemArmorClass(nodeChar);

		-- Add Spell Slots
		local nSpellCasterLevel = calcSpellcastingLevel();
		local nPactCasterLevel = calcPactMagicLevel();
		local nSpellClassLevels = 0;
		local nPactClassLevels = 0;
		local bHybrid = false;
		if nSpellCasterLevel > 0 or nPactCasterLevel > 0 then
			for _,vClass in pairs (CampaignRegistry.charwizard.classes) do
				if vClass.name == "paladin" or vClass.name == "ranger" and #CampaignRegistry.charwizard.classes == 1 then
					bHybrid = true;
				end
				if vClass.spellcaster and vClass.spellcaster == 1 then
					nSpellClassLevels = nSpellClassLevels + tonumber(vClass.level);
				elseif vClass.spellcaster and vClass.spellcaster == 2 then
					if bHybrid then
						if tonumber(vClass.level) > 1 then
							nSpellClassLevels = nSpellClassLevels + math.ceil(tonumber(vClass.level) / 2);
						end
					else
						nSpellClassLevels = nSpellClassLevels + math.floor(tonumber(vClass.level) / 2);
					end
				elseif vClass.spellcaster and vClass.spellcaster == 3 then
					nSpellClassLevels = nSpellClassLevels + math.floor(tonumber(vClass.level) / 3);				
				elseif vClass.spellcaster and vClass.spellcaster == 4 then
					nPactClassLevels = tonumber(vClass.level);
				elseif vClass.spellcaster and vClass.spellcaster == 5 then
					nSpellClassLevels = math.ceil(tonumber(vClass.level) / 2);
				end
			end
			addSpellSlots(nodeChar, nSpellClassLevels, nPactClassLevels, bHybrid);
		end

		-- Add Spells
		if CampaignRegistry.charwizard.spelllist then
			for _,vSpell in pairs (CampaignRegistry.charwizard.spelllist) do
				local sSource = vSpell.source;
				if sSource then
					sSource = StringManager.capitalize(sSource);
				end
				local sSpellClass = vSpell.class;
				local sSpellRecord = vSpell.record;
				local sSpellName = DB.getValue(DB.findNode(sSpellRecord), "name", "");
				if sSpellRecord and sSpellRecord ~= "" and sSpellRecord ~= "reference_spell" then
					PowerManager.addPower(sSpellClass, sSpellRecord, nodeChar, "Spells (" .. sSource .. ")");
					outputUserMessage("char_abilities_message_spelladd", sSpellName, DB.getValue(nodeChar, "name", ""));
				end
			end
		end

		-- Add Feats
		if CampaignRegistry.charwizard.feats then
			for _,vFeats in pairs (CampaignRegistry.charwizard.feats) do
				if CampaignRegistry.charwizard.feats.race then
					local sRaceFeatRecord = CampaignRegistry.charwizard.feats.race;
					addFeatDB(nodeChar, "reference_feat", sRaceFeatRecord);				
				end
				if CampaignRegistry.charwizard.feats.class then
					for _,vCRFeat in pairs(CampaignRegistry.charwizard.feats.class) do
						local sClassFeatRecord = vCRFeat.record;
						if sClassFeatRecord ~= "" then
							addFeatDB(nodeChar, "reference_feat", sClassFeatRecord);
						end
					end
				end			
			end
		end
	end
	close();
end

function addAbilityAdjustment(nodeChar, sAbility, nAdj, nAbilityMax)
	local k = sAbility:lower();
	if StringManager.contains(DataCommon.abilities, k) then
		local sPath = "abilities." .. k .. ".score";
		local sBonusPath = "abilities." .. k .. ".bonus";		
		local nCurrent = DB.getValue(nodeChar, sPath, 10);
		local nNewScore = nCurrent + nAdj;
		if nAbilityMax then
			nNewScore = math.max(math.min(nNewScore, nAbilityMax), nCurrent);
		end
		if nNewScore ~= nCurrent then
			DB.setValue(nodeChar, sPath, "number", nNewScore);
			local nBonus = ActorManager2.getAbilityBonus(nodeChar, k);			
			DB.setValue(nodeChar, sBonusPath, "number", nBonus);	
			outputUserMessage("char_abilities_message_abilityadd", StringManager.capitalize(k), nNewScore - nCurrent, DB.getValue(nodeChar, "name", ""));
		end
	end
end

function addSaveProf(nodeChar, sClass, sRecord)
	local nodeSource = resolveRefNode(sRecord);
	if not nodeSource then
		return;
	end
	for _,vClassProf in pairs(DB.getChildren(nodeSource, "proficiencies", "")) do
		if vClassProf.getName() == "savingthrows" then
			local sText = DB.getText(vClassProf, "text");
			for sProf in string.gmatch(sText, "(%a[%a%s]+)%,?") do
				local sProfLower = StringManager.trim(sProf:lower());
				if StringManager.contains(DataCommon.abilities, sProfLower) then
					DB.setValue(nodeChar, "abilities." .. sProfLower .. ".saveprof", "number", 1);
					outputUserMessage("char_abilities_message_saveadd", sProf, DB.getValue(nodeChar, "name", ""));
				end
			end
		end		
	end
end

function addBackgroundRef(nodeChar, sClass, sRecord)
	local nodeSource = resolveRefNode(sRecord);
	if not nodeSource then
		return;
	end

	-- Notify
	outputUserMessage("char_abilities_message_backgroundadd", DB.getValue(nodeSource, "name", ""), DB.getValue(nodeChar, "name", ""));

	-- Add the name and link to the main character sheet
	DB.setValue(nodeChar, "background", "string", DB.getValue(nodeSource, "name", ""));
	DB.setValue(nodeChar, "backgroundlink", "windowreference", sClass, nodeSource.getNodeName());
		
	for _,v in pairs(DB.getChildren(nodeSource, "features")) do
		addClassFeatureDB(nodeChar, "reference_backgroundfeature", v.getPath());
	end
end

function updateHitPoints(nodeChar, sClass, sRecord, nClassLevel)
	local aClassNames = {};
	local nTotalHP = DB.getValue(nodeChar, "hp.total", "number", 0);
	local nAddHP = 0;
	local nHP = 0;
	local nPrevLevel = 1;
	local bInclude = false;

	local nConBonus = DB.getValue(nodeChar, "abilities.constitution.bonus", 0);
	for _,vClass in pairs(CampaignRegistry.charwizard.classes) do
		if not vClass.appliedHP then
			for _,vImpClass in pairs(CampaignRegistry.charwizard.impclasses) do
				if vClass.record == vImpClass.record then
					nPrevLevel = vImpClass.level;
					table.insert(aClassNames, vClass.name);
					if tonumber(vClass.level) > vImpClass.level then
						bInclude = true;
					end
				end
			end

			if not StringManager.contains(aClassNames, vClass.name) or bInclude then 
				nHP = 0;
				nAddHP = 0;

				local nClassLevel = tonumber(vClass.level);
				local bHDFound = false;
				local nHDMult = 1;
				local nHDSides = 6;
				local sHD = DB.getText(DB.findNode(vClass.record), "hp.hitdice.text");
				if sHD then
					local sMult, sSides = sHD:match("(%d)d(%d+)");
					if sMult and sSides then
						nHDMult = tonumber(sMult);
						nHDSides = tonumber(sSides);
						bHDFound = true;
					end
				end
				if not bHDFound then
					outputUserMessage("char_error_addclasshd");
				end

				local nLevelDelta = (nClassLevel - nPrevLevel);
				if nLevelDelta < 1 then
					nLevelDelta = 1;
				end

				for i = 1,nLevelDelta do
					nAddHP = math.floor(((nHDMult * (nHDSides + 1)) / 2) + 0.5);
					nHP = nHP + nAddHP + nConBonus;
					outputUserMessage("char_abilities_message_hpaddavg", vClass.name, DB.getValue(nodeChar, "name", ""), nAddHP+nConBonus);
				end
			end
			vClass.appliedHP = true;
		end
		nTotalHP = nTotalHP + nHP;	
	end
	DB.setValue(nodeChar, "hp.total", "number", nTotalHP);
end

function addClassRef(nodeChar, sClass, sRecord, nClassLevel)
	local nodeSource = resolveRefNode(sRecord);
	local aClass = {};
	--local nPrevLevel = 1;
	local bMain = false;
	if not nodeSource then
		return;
	end

	-- Import - Find at what level the class was imported
	--[[
	if CampaignRegistry.charwizard.import then
		for _,vImpClass in pairs(CampaignRegistry.charwizard.impclasses) do
			if vImpClass.record == sRecord then
				nPrevLevel = vImpClass.level;
			end
		end
	end
	]]

	-- Check if this is the main class
	for _,vClass in pairs(CampaignRegistry.charwizard.classes) do
		if vClass.record == sRecord then
			aClass = vClass;
			if vClass.main then
				bMain = true;
			end
		end
	end	

	-- Get the list we are going to add to
	local nodeList = nodeChar.createChild("classes");
	if not nodeList then
		return;
	end
	
	-- Notify
	outputUserMessage("char_abilities_message_classadd", DB.getValue(nodeSource, "name", ""), DB.getValue(nodeChar, "name", ""));
	
	-- Translate Hit Die
	local bHDFound = false;
	local nHDMult = 1;
	local nHDSides = 6;
	local sHD = DB.getText(nodeSource, "hp.hitdice.text");
	if sHD then
		local sMult, sSides = sHD:match("(%d)d(%d+)");
		if sMult and sSides then
			nHDMult = tonumber(sMult);
			nHDSides = tonumber(sSides);
			bHDFound = true;
		end
	end
	if not bHDFound then
		outputUserMessage("char_error_addclasshd");
	end

	-- Keep some data handy for comparisons
	local sClassName = DB.getValue(nodeSource, "name", "");
	local sClassNameLower = StringManager.trim(sClassName):lower();

	-- Check to see if the character already has this class; or create a new class entry
	local nodeClass = nil;
	local sRecordSansModule = StringManager.split(sRecord, "@")[1] or "";
	local aCharClassNodes = CampaignRegistry.charwizard.classes	
	for _,v in pairs(aCharClassNodes) do
		local _,sExistingClassPath = DB.getValue(v.record, "shortcut", "", "");
		local sExistingClassPathSansModule = StringManager.split(sExistingClassPath, "@")[1] or "";
		if sExistingClassPathSansModule == sRecordSansModule then
			nodeClass = v;
			break;
		end
	end
	if not nodeClass then
		for _,v in pairs(aCharClassNodes) do
			local sExistingClassName = StringManager.trim(DB.getValue(v.record, "name", "")):lower();
			if (sExistingClassName == sClassNameLower) and (sExistingClassName ~= "") then
				nodeClass = v;
				break;
			end
		end
	end
	local bExistingClass = false;
	if nodeClass then
		bExistingClass = true;
	else
		nodeClass = nodeList.createChild();
	end
	
	-- Calculate number of spell caster levels
	local nCasterLevel = calcSpellcastingLevel();
	local nPactMagicLevel = calcPactMagicLevel();
	
	-- Any way you get here, overwrite or set the class reference link with the most current
	DB.setValue(nodeClass, "shortcut", "windowreference", sClass, sRecord);
	DB.setValue(nodeClass, "name", "string", sClassName);
	local aDice = {};
	table.insert(aDice, "d" .. nHDSides);
	DB.setValue(nodeClass, "hddie", "dice", aDice);
	DB.setValue(nodeClass, "level", "number", nClassLevel);	
	if CampaignRegistry.charwizard.import then
		updateHitPoints(nodeChar, sClass, sRecord, nClassLevel);
	else
		local nAddHP = 0;
		local nHP = 0;
		local nConBonus = DB.getValue(nodeChar, "abilities.constitution.bonus", 0);
		for i = 1,nClassLevel do
			if i == 1 and bMain then
				nAddHP = (nHDMult * nHDSides);
				nHP = nHP + nAddHP + nConBonus;
				outputUserMessage("char_abilities_message_hpaddmax", DB.getValue(nodeSource, "name", ""), DB.getValue(nodeChar, "name", ""), nAddHP+nConBonus);
			else
				nAddHP = math.floor(((nHDMult * (nHDSides + 1)) / 2) + 0.5);
				nHP = nHP + nAddHP + nConBonus;
				outputUserMessage("char_abilities_message_hpaddavg", DB.getValue(nodeSource, "name", ""), DB.getValue(nodeChar, "name", ""), nAddHP+nConBonus);
			end
		end
		--DB.setValue(nodeChar, "hp.total", "number", nHP);
		for _,vClass in pairs(CampaignRegistry.charwizard.classes) do
			if vClass.record == aClass.record then
				vClass.HP = nHP
			end
		end
	end
	-- Special hit point level up handling
	for _,v in pairs(DB.getChildren(nodeSource, "features")) do
		if not nCasterLevel then
			nCasterLevel = 1;
		end
		addClassFeatureDB(nodeChar, "reference_classfeature", v.getPath(), nodeClass, nClassLevel, nCasterLevel);
	end
end

function addClassFeatureDB(nodeChar, sClass, sRecord, nodeClass, nClassLevel, nCasterLevel)
	local nodeSource = resolveRefNode(sRecord);
	if not nodeSource then
		return;
	end

	-- Get the class name
	local sClassName = DB.getValue(nodeSource, "...name", "");

	local bSpecChoice = true;
	local sFeatureSpec = DB.getValue(nodeSource, "specialization", "");
	local sCharSpec = "";
	for _,vCRClassList in pairs(CampaignRegistry.charwizard.classes) do
		if vCRClassList.name == string.lower(sClassName) then
			sCharSpec = vCRClassList.spec;
		end
	end

	aSpecializationOptions = getClassSpecializationOptions(nodeSource);
	for _,vSpec in pairs(aSpecializationOptions) do
		if sFeatureSpec == "" or (string.lower(sFeatureSpec) == sCharSpec) then
			addClassFeatureDB(nodeChar, vSpec.linkclass, vSpec.linkrecord, 1, 1);
			return;
		end
	end

	
	-- Get the list we are going to add to
	local nodeList = nodeChar.createChild("featurelist");
	if not nodeList then
		return false;
	end
	
	-- Make sure this item does not already exist
	local sOriginalName = DB.getValue(nodeSource, "name", "");
	local sOriginalNameLower = StringManager.trim(sOriginalName:lower());
	local sFeatureName = sOriginalName;
	for _,v in pairs(nodeList.getChildren()) do
		if DB.getValue(v, "name", ""):lower() == sOriginalNameLower then
			if sOriginalNameLower == FEATURE_SPELLCASTING or sOriginalNameLower == FEATURE_PACT_MAGIC then
				sFeatureName = sFeatureName .. " (" .. sClassName .. ")";
			else
				return false;
			end
		end
	end
	
	-- Pull the feature level
	local nFeatureLevel = DB.getValue(nodeSource, "level", 0);
	if not nClassLevel then
		nClassLevel = 0;
	end

	-- If Tashas Module is loaded, check to see if any options were selected
	local aTashaReplaced = {};
	local aTashaSelected = {};	
	local aTashas = Module.getModuleInfo("DD Tashas Cauldron of Everything - Players");
	if aTashas and aTashas.loaded then
		if CampaignRegistry.charwizard.tashaoptions then
			for _,vTashaReplace in pairs(CampaignRegistry.charwizard.tashaoptions) do
				if vTashaReplace ~= "" then
					table.insert(aTashaReplaced, vTashaReplace.replacement);
				end
			end
			for _,vTashaOpt in pairs(CampaignRegistry.charwizard.tashaoptions) do
				if vTashaOpt ~= "" then
					table.insert(aTashaSelected, vTashaOpt.name);
				end
			end
			local sOptionName = sOriginalName:gsub(" %(Option([^.]+)", "");
			if StringManager.contains(aTashaReplaced, sOriginalNameLower) then
				return false;
			elseif string.match(sOriginalNameLower, "option") and not StringManager.contains(aTashaSelected, sOptionName) then
				return false;				
			else
				if nFeatureLevel <= nClassLevel and (sFeatureSpec == "" or string.lower(sFeatureSpec) == sCharSpec) then
					if bSpecChoice then
						local vNew = nodeList.createChild();
						DB.copyNode(nodeSource, vNew);
						DB.setValue(vNew, "name", "string", sFeatureName);
						DB.setValue(vNew, "source", "string", DB.getValue(nodeSource, "...name", ""));
						DB.setValue(vNew, "locked", "number", 1);
						outputUserMessage("char_abilities_message_featureadd", sFeatureName, DB.getValue(nodeChar, "name", ""));		
					end
				end							
			end					
		end
	else
		if nFeatureLevel <= nClassLevel and (sFeatureSpec == "" or string.lower(sFeatureSpec) == sCharSpec) then
			if bSpecChoice then
				local vNew = nodeList.createChild();
				DB.copyNode(nodeSource, vNew);
				DB.setValue(vNew, "name", "string", sFeatureName);
				DB.setValue(vNew, "source", "string", DB.getValue(nodeSource, "...name", ""));
				DB.setValue(vNew, "locked", "number", 1);
				outputUserMessage("char_abilities_message_featureadd", sFeatureName, DB.getValue(nodeChar, "name", ""));		
			end
		end
	end

	-- Special handling
	if sOriginalNameLower == "spellcasting" then
		-- Add spell casting ability
		local sSpellcasting = DB.getText(nodeSource, "text", "");
		local sAbility = sSpellcasting:match("(%a+) is your spellcasting ability");
		if sAbility then
			local sSpellsLabel = Interface.getString("power_label_groupspells");
			local sLowerSpellsLabel = sSpellsLabel:lower();
			local bFoundSpellcasting = false;
			for _,vGroup in pairs (DB.getChildren(nodeSource, "powergroup")) do
				if DB.getValue(vGroup, "name", ""):lower() == sLowerSpellsLabel then
					bFoundSpellcasting = true;
					break;
				end
			end
			
			local sNewGroupName = sSpellsLabel;
			if bFoundSpellcasting then
				sNewGroupName = sNewGroupName .. " (" .. sClassName .. ")";
			end
			
			local nodePowerGroups = DB.createChild(nodeChar, "powergroup");
			local nodeNewGroup = nodePowerGroups.createChild();
			DB.setValue(nodeNewGroup, "castertype", "string", "memorization");
			DB.setValue(nodeNewGroup, "stat", "string", sAbility:lower());
			DB.setValue(nodeNewGroup, "name", "string", sNewGroupName);
			
			if sSpellcasting:match("Preparing and Casting Spells") then
				local rActor = ActorManager.getActor("pc", nodeChar);
				DB.setValue(nodeNewGroup, "prepared", "number", math.min(1 + ActorManager2.getAbilityBonus(rActor, sAbility:lower())));
			end
		end

		-- Add spell slot calculation info
		if nodeClass and nFeatureLevel > 0 then
			if DB.getValue(nodeClass, "casterlevelinvmult", 0) == 0 then
				DB.setValue(nodeClass, "casterlevelinvmult", "number", nFeatureLevel);
			end
		end

		-- Determine whether a specialization is added this level
		local nodeSpecializationFeature = nil;
		local aSpecializationOptions = {};
		for _,v in pairs(DB.getChildren(nodeSource, "features")) do
			if (DB.getValue(v, "level", 0) == nLevel) and (DB.getValue(v, "specializationchoice", 0) == 1) then
				nodeSpecializationFeature = v;
				aSpecializationOptions = getClassSpecializationOptions(nodeSource);
				break;
			end
		end
		
		-- Add features, with customization based on whether specialization is added this level
		local rClassAdd = { nodeChar = nodeChar, nodeSource = nodeSource, nLevel = nLevel, nodeClass = nodeClass, nCasterLevel = nCasterLevel, nPactMagicLevel = nPactMagicLevel };
		if #aSpecializationOptions == 0 then
			addClassFeatureHelper(nil, rClassAdd);
		elseif #aSpecializationOptions == 1 then
			addClassFeatureHelper( { aSpecializationOptions[1].text }, rClassAdd, "normal");
		end

	elseif sOriginalNameLower == FEATURE_PACT_MAGIC then
		-- Add spell casting ability
		local sAbility = DB.getText(vNew, "text", ""):match("(%a+) is your spellcasting ability");
		if sAbility then
			local sSpellsLabel = Interface.getString("power_label_groupspells");
			local sLowerSpellsLabel = sSpellsLabel:lower();
			
			local bFoundSpellcasting = false;
			for _,vGroup in pairs (DB.getChildren(nodeChar, "powergroup")) do
				if DB.getValue(vGroup, "name", ""):lower() == sLowerSpellsLabel then
					bFoundSpellcasting = true;
					break;
				end
			end
			
			local sNewGroupName = sSpellsLabel;
			if bFoundSpellcasting then
				sNewGroupName = sNewGroupName .. " (" .. sClassName .. ")";
			end
			
			local nodePowerGroups = DB.createChild(nodeChar, "powergroup");
			local nodeNewGroup = nodePowerGroups.createChild();
			DB.setValue(nodeNewGroup, "castertype", "string", "memorization");
			DB.setValue(nodeNewGroup, "stat", "string", sAbility:lower());
			DB.setValue(nodeNewGroup, "name", "string", sNewGroupName);
		end
		
		-- Add spell slot calculation info

		DB.setValue(nodeClass, "casterpactmagic", "number", 1);
		if nodeClass and nFeatureLevel > 0 then
			if DB.getValue(nodeClass, "casterlevelinvmult", 0) == 0 then
				DB.setValue(nodeClass, "casterlevelinvmult", "number", nFeatureLevel);
			end
		end
	
	elseif sOriginalNameLower == FEATURE_DRACONIC_RESILIENCE then
		applyDraconicResilience(nodeChar, true);
	elseif sOriginalNameLower == FEATURE_UNARMORED_DEFENSE then
		applyUnarmoredDefense(nodeChar, nodeClass);
	end
	
	-- Determine whether a specialization is added this level
	local nodeSpecializationFeature = nil;
	local aSpecializationOptions = {};
	for _,v in pairs(DB.getChildren(nodeSource, "features")) do
		if (DB.getValue(v, "level", 0) <= nClassLevel) and (true) then
			nodeSpecializationFeature = v;
			aSpecializationOptions = getClassSpecializationOptions(nodeSource);
			break;
		end
	end
	
	-- Add features, with customization based on whether specialization is added this level
	local rClassAdd = { nodeChar = nodeChar, nodeSource = nodeSource, nLevel = nClassLevel, nodeClass = nodeClass, nCasterLevel = nCasterLevel, nPactMagicLevel = nPactMagicLevel };
	if #aSpecializationOptions == 0 then
		addClassFeatureHelper(nil, rClassAdd);
	elseif #aSpecializationOptions == 1 then
		addClassFeatureHelper( { aSpecializationOptions[1].text }, rClassAdd);
	end

	return true;
end

function addFeatures(nodeChar, nodeSource, nCurrentLevel, nLevel, sSpecialization, nodeClass)
	if not nCurrentLevel then
		nCurrentlevel = 0;
	end
	for _,v in pairs(DB.getChildren(nodeSource, "features")) do
		if (DB.getValue(v, "level", 0) <= nLevel) and (DB.getValue(v, "specializationchoice", 0) == 0) then
			if DB.getValue(v, "level", 0) >= nCurrentLevel then
				local sFeatureName = DB.getValue(v, "name", "");
				local sFeatureSpec = DB.getValue(v, "specialization", "");
				if sFeatureSpec and sSpecialization then
					if sFeatureSpec == "" or string.lower(sFeatureSpec) == string.lower(sSpecialization) then
						CharManager.addClassFeatureDB(nodeChar, "reference_classfeature", v.getPath(), nodeClass);
					end
				end
			end
		end
	end
end

function addClassFeatureHelper(aSelection, rClassAdd, sMagicType)
	local nodeSource = rClassAdd.nodeSource;
	local nodeChar = rClassAdd.nodeChar;
	-- Check to see if we added specialization
	if aSelection then
		if #aSelection ~= 1 then
			outputUserMessage("char_error_addclassspecialization");
			return;
		end
		
		local aSpecializationOptions = getClassSpecializationOptions(rClassAdd.nodeSource);
		for _,v in ipairs(aSpecializationOptions) do
			if v.text == aSelection[1] then
				addClassFeatureDB(nodeChar, "reference_classability", v.linkrecord, rClassAdd.nodeClass);
				break;
			end
		end
	end
	
	-- Add features
	local aMatchingClassNodes = {};
	local sClassNameLower = StringManager.trim(DB.getValue(nodeSource, "name", "")):lower();
	local aMappings = LibraryData.getMappings("class");
	for _,vMapping in ipairs(aMappings) do
		for _,vNode in pairs(DB.getChildrenGlobal(vMapping)) do
			local sExistingClassName = StringManager.trim(DB.getValue(vNode, "name", "")):lower();
			if (sExistingClassName == sClassNameLower) and (sExistingClassName ~= "") then
				table.insert(aMatchingClassNodes, vNode);
				if nodeSource then
					nodeSource = nil;
				end
			end
		end
	end
	if nodeSource then
		table.insert(aMatchingClassNodes, nodeSource);
	end
	local aAddedFeatures = {};
	for _,vNode in ipairs(aMatchingClassNodes) do
		for _,vFeature in pairs(DB.getChildren(vNode, "features")) do
			if (DB.getValue(vFeature, "level", 0) == rClassAdd.nLevel) and (DB.getValue(vFeature, "specializationchoice", 0) == 0) then
				local sFeatureName = DB.getValue(vFeature, "name", "");
				local sFeatureSpec = DB.getValue(vFeature, "specialization", "");
				if (sFeatureSpec == "") or hasFeature(nodeChar, sFeatureSpec) then
					local sFeatureNameLower = StringManager.trim(sFeatureName):lower();
					if not aAddedFeatures[sFeatureNameLower] then
						addClassFeatureDB(nodeChar, "reference_classfeature", vFeature.getPath(), rClassAdd.nodeClass);
						aAddedFeatures[sFeatureNameLower] = true;
					end
				end
			end
		end
	end
end

function addSpellSlots(nodeChar, nLevel, nPact, bHybrid, nSpellCasterLevel, nPactCasterLevel, nPrevSpellCasterLevel, nPrevPactCasterLevel)
	if nSpellCasterlevel == 0 or not nSpellCasterLevel then
		nSpellCasterLevel = 1;
	end
	if nPrevCasterlevel == 0 or not nPrevCasterLevel then
		nPrevCasterLevel = 1;
	end	
	-- Increment spell slots for spellcasting level
	if nLevel and nLevel > 0 then
		DB.setValue(nodeChar, "powermeta.spellslots1.max", "number", 0);
		DB.setValue(nodeChar, "powermeta.spellslots2.max", "number", 0);
		DB.setValue(nodeChar, "powermeta.spellslots3.max", "number", 0);
		DB.setValue(nodeChar, "powermeta.spellslots4.max", "number", 0);
		DB.setValue(nodeChar, "powermeta.spellslots5.max", "number", 0);
		DB.setValue(nodeChar, "powermeta.spellslots6.max", "number", 0);
		DB.setValue(nodeChar, "powermeta.spellslots7.max", "number", 0);
		DB.setValue(nodeChar, "powermeta.spellslots8.max", "number", 0);
		DB.setValue(nodeChar, "powermeta.spellslots9.max", "number", 0);
		for i = nPrevCasterLevel, nLevel do
			if i == 1 then
				DB.setValue(nodeChar, "powermeta.spellslots1.max", "number", DB.getValue(nodeChar, "powermeta.spellslots1.max", 0) + 2);
			elseif i == 2 then
				DB.setValue(nodeChar, "powermeta.spellslots1.max", "number", DB.getValue(nodeChar, "powermeta.spellslots1.max", 0) + 1);
			elseif i == 3 then
				DB.setValue(nodeChar, "powermeta.spellslots1.max", "number", DB.getValue(nodeChar, "powermeta.spellslots1.max", 0) + 1);
				DB.setValue(nodeChar, "powermeta.spellslots2.max", "number", DB.getValue(nodeChar, "powermeta.spellslots2.max", 0) + 2);
			elseif i == 4 then
				DB.setValue(nodeChar, "powermeta.spellslots2.max", "number", DB.getValue(nodeChar, "powermeta.spellslots2.max", 0) + 1);
			elseif i == 5 then
				DB.setValue(nodeChar, "powermeta.spellslots3.max", "number", DB.getValue(nodeChar, "powermeta.spellslots3.max", 0) + 2);
			elseif i == 6 then
				DB.setValue(nodeChar, "powermeta.spellslots3.max", "number", DB.getValue(nodeChar, "powermeta.spellslots3.max", 0) + 1);
			elseif i == 7 then
				DB.setValue(nodeChar, "powermeta.spellslots4.max", "number", DB.getValue(nodeChar, "powermeta.spellslots4.max", 0) + 1);
			elseif i == 8 then
				DB.setValue(nodeChar, "powermeta.spellslots4.max", "number", DB.getValue(nodeChar, "powermeta.spellslots4.max", 0) + 1);
			elseif i == 9 then
				DB.setValue(nodeChar, "powermeta.spellslots4.max", "number", DB.getValue(nodeChar, "powermeta.spellslots4.max", 0) + 1);
				DB.setValue(nodeChar, "powermeta.spellslots5.max", "number", DB.getValue(nodeChar, "powermeta.spellslots5.max", 0) + 1);
			elseif i == 10 then
				DB.setValue(nodeChar, "powermeta.spellslots5.max", "number", DB.getValue(nodeChar, "powermeta.spellslots5.max", 0) + 1);
			elseif i == 11 then
				DB.setValue(nodeChar, "powermeta.spellslots6.max", "number", DB.getValue(nodeChar, "powermeta.spellslots6.max", 0) + 1);
			elseif i == 12 then
				-- No change
			elseif i == 13 then
				DB.setValue(nodeChar, "powermeta.spellslots7.max", "number", DB.getValue(nodeChar, "powermeta.spellslots7.max", 0) + 1);
			elseif i == 14 then
				-- No change
			elseif i == 15 then
				DB.setValue(nodeChar, "powermeta.spellslots8.max", "number", DB.getValue(nodeChar, "powermeta.spellslots8.max", 0) + 1);
			elseif i == 16 then
				-- No change
			elseif i == 17 then
				DB.setValue(nodeChar, "powermeta.spellslots9.max", "number", DB.getValue(nodeChar, "powermeta.spellslots9.max", 0) + 1);
			elseif i == 18 then
				DB.setValue(nodeChar, "powermeta.spellslots5.max", "number", DB.getValue(nodeChar, "powermeta.spellslots5.max", 0) + 1);
			elseif i == 19 then
				DB.setValue(nodeChar, "powermeta.spellslots6.max", "number", DB.getValue(nodeChar, "powermeta.spellslots6.max", 0) + 1);
			elseif i == 20 then
				DB.setValue(nodeChar, "powermeta.spellslots7.max", "number", DB.getValue(nodeChar, "powermeta.spellslots7.max", 0) + 1);
			end
		end
	end
	
	if nPactCasterlevel == 0 or not nPactCasterlevel then
		nPactCasterLevel = 1;
	end
	if nPrevPactCasterlevel == 0 or not nPrevPactCasterlevel then
		nPrevPactCasterLevel = 1;
	end	
	-- Adjust spell slots for pact magic level increase
	if nPact and nPact > 0 then
		DB.setValue(nodeChar, "powermeta.pactmagicslots1.max", "number", 0);
		DB.setValue(nodeChar, "powermeta.pactmagicslots2.max", "number", 0);
		DB.setValue(nodeChar, "powermeta.pactmagicslots3.max", "number", 0);
		DB.setValue(nodeChar, "powermeta.pactmagicslots4.max", "number", 0);
		DB.setValue(nodeChar, "powermeta.pactmagicslots5.max", "number", 0);		
		for i = nPrevPactCasterLevel, nPact do
			if i == 1 then
				DB.setValue(nodeChar, "powermeta.pactmagicslots1.max", "number", DB.getValue(nodeChar, "powermeta.pactmagicslots1.max", 0) + 1);
			elseif i == 2 then
				DB.setValue(nodeChar, "powermeta.pactmagicslots1.max", "number", DB.getValue(nodeChar, "powermeta.pactmagicslots1.max", 0) + 1);
			elseif i == 3 then
				DB.setValue(nodeChar, "powermeta.pactmagicslots1.max", "number", math.max(DB.getValue(nodeChar, "powermeta.pactmagicslots1.max", 0) - 2, 0));
				DB.setValue(nodeChar, "powermeta.pactmagicslots2.max", "number", DB.getValue(nodeChar, "powermeta.pactmagicslots2.max", 0) + 2);
			elseif i == 4 then
				-- No change
			elseif i == 5 then
				DB.setValue(nodeChar, "powermeta.pactmagicslots2.max", "number", math.max(DB.getValue(nodeChar, "powermeta.pactmagicslots2.max", 0) - 2, 0));
				DB.setValue(nodeChar, "powermeta.pactmagicslots3.max", "number", DB.getValue(nodeChar, "powermeta.pactmagicslots3.max", 0) + 2);
			elseif i == 6 then
				-- No change
			elseif i == 7 then
				DB.setValue(nodeChar, "powermeta.pactmagicslots3.max", "number", math.max(DB.getValue(nodeChar, "powermeta.pactmagicslots3.max", 0) - 2, 0));
				DB.setValue(nodeChar, "powermeta.pactmagicslots4.max", "number", DB.getValue(nodeChar, "powermeta.pactmagicslots4.max", 0) + 2);
			elseif i == 8 then
				-- No change
			elseif i == 9 then
				DB.setValue(nodeChar, "powermeta.pactmagicslots4.max", "number", math.max(DB.getValue(nodeChar, "powermeta.pactmagicslots4.max", 0) - 2, 0));
				DB.setValue(nodeChar, "powermeta.pactmagicslots5.max", "number", DB.getValue(nodeChar, "powermeta.pactmagicslots5.max", 0) + 2);
			elseif i == 10 then
				-- No change
			elseif i == 11 then
				DB.setValue(nodeChar, "powermeta.pactmagicslots5.max", "number", DB.getValue(nodeChar, "powermeta.pactmagicslots5.max", 0) + 1);
			elseif i == 12 then
				-- No change
			elseif i == 13 then
				-- No change
			elseif i == 14 then
				-- No change
			elseif i == 15 then
				-- No change
			elseif i == 16 then
				-- No change
			elseif i == 17 then
				DB.setValue(nodeChar, "powermeta.pactmagicslots5.max", "number", DB.getValue(nodeChar, "powermeta.pactmagicslots5.max", 0) + 1);
			elseif i == 18 then
				-- No change
			elseif i == 19 then
				-- No change
			elseif i == 20 then
				-- No change
			end
		end
	end
end


function addFeatDB(nodeChar, sClass, sRecord)
	local nodeSource = resolveRefNode(sRecord);
	if not nodeSource then
		return;
	end
	
	-- Get the list we are going to add to
	local nodeList = nodeChar.createChild("featlist");
	if not nodeList then
		return false;
	end
	
	-- Make sure this item does not already exist
	local sName = DB.getValue(nodeSource, "name", "");
	for _,v in pairs(nodeList.getChildren()) do
		if DB.getValue(v, "name", "") == sName then
			return flase;
		end
	end

	-- Add the item
	local vNew = nodeList.createChild();
	DB.copyNode(nodeSource, vNew);
	DB.setValue(vNew, "locked", "number", 1);

	-- Special handling
	local sNameLower = sName:lower();
	if sNameLower == FEAT_TOUGH then
		applyTough(nodeChar, true);
	end

	-- Announce
	outputUserMessage("char_abilities_message_featadd", DB.getValue(vNew, "name", ""), DB.getValue(nodeChar, "name", ""));
	return true;
end

function setSpellcasterCode(bImport)
	local sImportPath = CampaignRegistry.charwizard.classes;
	if bImport then
		sImportPath = CampaignRegistry.charwizard.impclasses;
	end
	for _,vClass in pairs(sImportPath) do
		local sFeature = "";
		for _,vFeature in pairs(DB.getChildren(DB.findNode(vClass.record), "features")) do
			if string.lower(DB.getValue(vFeature, "name", "")) == FEATURE_SPELLCASTING then
				sFeature = FEATURE_SPELLCASTING;
			elseif string.lower(DB.getValue(vFeature, "name", "")) == FEATURE_PACT_MAGIC then
				sFeature = FEATURE_PACT_MAGIC;			
			end
		end
		if sFeature == FEATURE_SPELLCASTING then
			if vClass.name == "fighter" or vClass.name == "rogue" then
				if vClass.spec == "eldritch knight" or vClass.spec == "arcane trickster" then
					vClass.spellcaster = 3;
				else
					vClass.spellcaster = 0;
				end
			elseif vClass.name == "paladin" or vClass.name == "ranger" then
				vClass.spellcaster = 2;
			elseif vClass.name == "artificer" then
				vClass.spellcaster = 5;					
			else
				vClass.spellcaster = 1;
			end
		elseif sFeature == FEATURE_PACT_MAGIC then
			vClass.spellcaster = 4;
		else
			vClass.spellcaster = 0;
		end
	end
end

function calcSpellcastingLevel()
	nCurrSpellCastLevel = 0;
	-- Assign spellcaster codes to classes
	setSpellcasterCode()
	for _,vClass in pairs(CampaignRegistry.charwizard.classes) do
		if vClass.spellcaster == 1 then
			nCurrSpellCastLevel = nCurrSpellCastLevel + vClass.level;
		elseif vClass.spellcaster == 2 then
			nCurrSpellCastLevel = nCurrSpellCastLevel + math.floor(vClass.level / 2);			
		elseif vClass.spellcaster == 3 then
			nCurrSpellCastLevel = nCurrSpellCastLevel + math.floor(vClass.level / 3);
		elseif vClass.spellcaster == 5 then
			nCurrSpellCastLevel = nCurrSpellCastLevel + math.ceil(vClass.level / 2);
		end
	end
	return nCurrSpellCastLevel;
end

function calcPactMagicLevel()
	nCurrPactCastLevel = 0;
	-- Assign spellcaster codes to classes
	setSpellcasterCode()
	-- Determine Pact Levels
	for _,vClass in pairs(CampaignRegistry.charwizard.classes) do
		nClassLevel = tonumber(vClass.level);
		if vClass.spellcaster == 4 then
			if nClassLevel > 16 then
				nCurrPactCastLevel = 4;
			elseif nClassLevel > 10 then
				nCurrPactCastLevel = 3;
			elseif nClassLevel > 1 then
				nCurrPactCastLevel = 2;
			else
				nCurrPactCastLevel = 1;
			end
		end
	end
	return nCurrPactCastLevel;
end

function addSpellLevels(nodeClass, nClassLevel, sAbility, nAbilityScore)
	if sOriginalNameLower == FEATURE_SPELLCASTING then
		-- Add spell casting ability
		local sSpellcasting = DB.getText(vNew, "text", "");
		local sAbility = sSpellcasting:match("(%a+) is your spellcasting ability");
		if sAbility then
			local sSpellsLabel = Interface.getString("power_label_groupspells");
			local sLowerSpellsLabel = sSpellsLabel:lower();
			
			local bFoundSpellcasting = false;
			for _,vGroup in pairs (DB.getChildren(nodeChar, "powergroup")) do
				if DB.getValue(vGroup, "name", ""):lower() == sLowerSpellsLabel then
					bFoundSpellcasting = true;
					break;
				end
			end
			
			local sNewGroupName = sSpellsLabel;
			if bFoundSpellcasting then
				sNewGroupName = sNewGroupName .. " (" .. sClassName .. ")";
			end
			
			local nodePowerGroups = DB.createChild(nodeChar, "powergroup");
			local nodeNewGroup = nodePowerGroups.createChild();
			DB.setValue(nodeNewGroup, "castertype", "string", "memorization");
			DB.setValue(nodeNewGroup, "stat", "string", sAbility:lower());
			DB.setValue(nodeNewGroup, "name", "string", sNewGroupName);
			
			if sSpellcasting:match("Preparing and Casting Spells") then
				local rActor = ActorManager.getActor("pc", nodeChar);
				DB.setValue(nodeNewGroup, "prepared", "number", math.min(1 + ActorManager2.getAbilityBonus(rActor, sAbility:lower())));
			end
		end
		
		-- Add spell slot calculation info
		if nodeClass and nFeatureLevel > 0 then
			if DB.getValue(nodeClass, "casterlevelinvmult", 0) == 0 then
				DB.setValue(nodeClass, "casterlevelinvmult", "number", nFeatureLevel);
			end
		end

	elseif sOriginalNameLower == FEATURE_PACT_MAGIC then
		-- Add spell casting ability
		local sAbility = DB.getText(vNew, "text", ""):match("(%a+) is your spellcasting ability");
		if sAbility then
			local sSpellsLabel = Interface.getString("power_label_groupspells");
			local sLowerSpellsLabel = sSpellsLabel:lower();
			
			local bFoundSpellcasting = false;
			for _,vGroup in pairs (DB.getChildren(nodeChar, "powergroup")) do
				if DB.getValue(vGroup, "name", ""):lower() == sLowerSpellsLabel then
					bFoundSpellcasting = true;
					break;
				end
			end
			
			local sNewGroupName = sSpellsLabel;
			if bFoundSpellcasting then
				sNewGroupName = sNewGroupName .. " (" .. sClassName .. ")";
			end
			
			local nodePowerGroups = DB.createChild(nodeChar, "powergroup");
			local nodeNewGroup = nodePowerGroups.createChild();
			DB.setValue(nodeNewGroup, "castertype", "string", "memorization");
			DB.setValue(nodeNewGroup, "stat", "string", sAbility:lower());
			DB.setValue(nodeNewGroup, "name", "string", sNewGroupName);
		end
		
		-- Add spell slot calculation info
		DB.setValue(nodeClass, "casterpactmagic", "number", 1);
		if nodeClass and nFeatureLevel > 0 then
			if DB.getValue(nodeClass, "casterlevelinvmult", 0) == 0 then
				DB.setValue(nodeClass, "casterlevelinvmult", "number", nFeatureLevel);
			end
		end
	end
end

function addLanguagesDB(nodeChar)
	-- Get the list we are going to add to
	local nodeList = nodeChar.createChild("languagelist");
	if not nodeList then
		return false;
	end

	local vNew;
	for _,v in pairs(summary.subwindow.summary_languages.getWindows()) do
		-- Add Languages
		vNew = nodeList.createChild();		
		DB.setValue(vNew, "name", "string", v.language.getValue());

		-- Announce
		outputUserMessage("char_abilities_message_languageadd", DB.getValue(vNew, "name", ""), DB.getValue(nodeChar, "name", ""));		
	end
	return true;
end

function addProficiencyDB(nodeChar)
	-- Get the list we are going to add to
	local nodeList = nodeChar.createChild("proficiencylist");
	if not nodeList then
		return false;
	end

	local vNew;
	for _,v in pairs(summary.subwindow.summary_proficiencies.getWindows()) do
		-- Add Proficiencies
		vNew = nodeList.createChild();		
		DB.setValue(vNew, "name", "string", v.name.getValue());

		-- Announce
		outputUserMessage("char_abilities_message_profadd", DB.getValue(vNew, "name", ""), DB.getValue(nodeChar, "name", ""));		
	end
	return true;
end

function addTraitsDB(nodeChar, sClass, sRecord)
	local nodeSource = resolveRefNode(sRecord);
	if not nodeSource then
		return;
	end
	-- Get the list we are going to add to
	local nodeList = nodeChar.createChild("traitlist");
	if not nodeList then
		return false;
	end
	aDuplicates = {};
	local sTraitWindowDuplicate = "";
	for _,vDuplicate in pairs(summary.subwindow.summary_traits.getWindows()) do
		sTraitWindowDuplicate = string.lower(sTraitWindowDuplicate:gsub(" ", ""));
		table.insert (aDuplicates, sTraitWindowDuplicate);
	end

	local vNew;
	local nodeTrait = "";
	local sTraitClass = "";
	local sTraitRecord = "";
	for _,v in pairs(summary.subwindow.summary_traits.getWindows()) do
		for _,vTrait in pairs(DB.getChildren(nodeSource, "traits")) do
			local sTraitName = CampaignDataManager2.sanitize(DB.getValue(vTrait, "name", ""));
			local sTraitWindowName = string.lower(v.name.getValue());
			sTraitWindowName = sTraitWindowName:gsub(" ", "");
			if sTraitWindowName == sTraitName and not StringManager.contains(aDuplicates, sTraitName) then
				nodeTrait = vTrait;
			end
		end
		-- Add Traits
		if nodeTrait and nodeTrait ~= "" then
			vNew = nodeList.createChild();
			DB.copyNode(nodeTrait, vNew);		
			DB.setValue(vNew, "name", "string", v.name.getValue());
			DB.setValue(vNew, "locked", "number", 1);		
			--DB.setValue(vNew, "type", "string", "racial");
			if sClass == "reference_racialtrait" then
				DB.setValue(vNew, "type", "string", "racial");
			elseif sClass == "reference_subracialtrait" then
				DB.setValue(vNew, "type", "string", "subracial");
			end
			outputUserMessage("char_abilities_message_traitadd", DB.getValue(vNew, "name", ""), DB.getValue(nodeChar, "name", ""));			
		end
		nodeTrait = "";
		sTraitClass = "";
		sTraitRecord = "";		
		-- Announce
	end
	return true;
end

function addSkillDB(nodeChar, nProficient)
	-- Get the list we are going to add to
	local nodeList = nodeChar.createChild("skilllist");
	if not nodeList then
		return nil;
	end

	local nodeSkill;	
	local sSkill;
	for _,v in pairs(summary.subwindow.summary_skills.getWindows()) do
		-- Add Skills
		nodeSkill = nodeList.createChild();
		sSkill = v.name.getValue();
		
		DB.setValue(nodeSkill, "name", "string", sSkill);
		if DataCommon.skilldata[sSkill] then
			DB.setValue(nodeSkill, "stat", "string", DataCommon.skilldata[sSkill].stat);
		end
		local nProficient = 1;
		for _,vClass in pairs(CampaignRegistry.charwizard.classes) do
			if vClass.name == "rogue" then
				if StringManager.contains(vClass.expertise, sSkill) then
					nProficient = 2;
				end
			end
		end
		DB.setValue(nodeSkill, "prof", "number", nProficient);		

		-- Announce
		outputUserMessage("char_abilities_message_skilladd", DB.getValue(nodeSkill, "name", ""), DB.getValue(nodeChar, "name", ""));
		if nProficient == 2 then
			outputUserMessage("Expertise " .. "char_abilities_message_skilladd", DB.getValue(nodeSkill, "name", ""), DB.getValue(nodeChar, "name", ""));
		end
	end
end

function applyDraconicResilience(nodeChar, bInitialAdd)
	-- Add extra hit points
	local nAddHP = 1;
	local nHP = DB.getValue(nodeChar, "hp.total", 0);
	nHP = nHP + nAddHP;
	DB.setValue(nodeChar, "hp.total", "number", nHP);
	
	outputUserMessage("char_abilities_message_hpaddfeature", StringManager.capitalizeAll(FEATURE_DRACONIC_RESILIENCE), DB.getValue(nodeChar, "name", ""), nAddHP);
		
	if bInitialAdd then
		-- Add armor (if wearing none)
		local nArmor = DB.getValue(nodeChar, "defenses.ac.armor", 0);
		if nArmor == 0 then
			DB.setValue(nodeChar, "defenses.ac.armor", "number", 3);
		end
	end
end

function applyDwarvenToughness(nodeChar, bInitialAdd)
	-- Add extra hit points
	local nAddHP = 1;
	if bInitialAdd then
		nAddHP = 0;
		for _,nodeChild in pairs(DB.getChildren(nodeChar, "classes")) do
			local nLevel = DB.getValue(nodeChild, "level", 0);
			if nLevel > 0 then
				nAddHP = nAddHP + nLevel;
			end
		end
	end
	
	local nHP = DB.getValue(nodeChar, "hp.total", 0);
	nHP = nHP + nAddHP;
	DB.setValue(nodeChar, "hp.total", "number", nHP);
	
	outputUserMessage("char_abilities_message_hpaddtrait", StringManager.capitalizeAll(TRAIT_DWARVEN_TOUGHNESS), DB.getValue(nodeChar, "name", ""), nAddHP);
end

function applyUnarmoredDefense(nodeChar, nodeClass)
	local sAbility = "";
	local sClassLower = DB.getValue(nodeClass, "name", ""):lower();
	if sClassLower == CLASS_BARBARIAN then
		sAbility = "constitution";
	elseif sClassLower == CLASS_MONK then
		sAbility = "wisdom";
	end
	
	if (sAbility ~= "") and (DB.getValue(nodeChar,  "defenses.ac.stat2", "") == "") then
		DB.setValue(nodeChar, "defenses.ac.stat2", "string", sAbility);
	end
end

function hasTrait(nodeChar, sTrait)
	return (getTraitRecord(nodeChar, sTrait) ~= nil);
end

function getTraitRecord(nodeChar, sTrait)
	local sTraitLower = StringManager.trim(sTrait):lower();
	for _,v in pairs(DB.getChildren(nodeChar, "traitlist")) do
		if StringManager.trim(DB.getValue(v, "name", "")):lower() == sTraitLower then
			return v;
		end
	end
	return nil;
end

function addToWeaponDB(nodeChar, nodeItem)
	-- Parameter validation
	if not ItemManager2.isWeapon(nodeItem) then
		return;
	end
	
	-- Get the weapon list we are going to add to
	local nodeWeapons = nodeChar.createChild("weaponlist");
	if not nodeWeapons then
		return;
	end
	
	-- Set new weapons as equipped
	DB.setValue(nodeItem, "carried", "number", 2);

	-- Determine identification
	local nItemID = 0;
	if LibraryData.getIDState("item", nodeItem, true) then
		nItemID = 1;
	end
	
	-- Grab some information from the source node to populate the new weapon entries
	local sName;
	if nItemID == 1 then
		sName = DB.getValue(nodeItem, "name", "");
	else
		sName = DB.getValue(nodeItem, "nonid_name", "");
		if sName == "" then
			sName = Interface.getString("item_unidentified");
		end
		sName = "** " .. sName .. " **";
	end
	local nBonus = 0;
	if nItemID == 1 then
		nBonus = DB.getValue(nodeItem, "bonus", 0);
	end

	-- Handle special weapon properties
	local sProps = DB.getValue(nodeItem, "properties", "");
	local aWeaponProps = StringManager.split(sProps:lower(), ",", true);
	
	local bThrown = false;
	local bMissile = false;
	local bFinesse = false;
	local bMagic = false;
	local bSpecial = false;
	for _,vProperty in ipairs(aWeaponProps) do
		if vProperty:match("^thrown %(?range ") then
			bThrown = true;
		elseif vProperty:match("^finesse$") then
			bFinesse = true;
		elseif vProperty:match("^magic$") then
			bMagic = true;
		end
	end
	
	local sType = DB.getValue(nodeItem, "subtype", ""):lower();
	local bMelee = true;
	local bRanged = false;
	if sType:find("ranged") then
		bMelee = false;
		bRanged = true;
	end
	
	-- Parse damage field
	local sDamage = DB.getValue(nodeItem, "damage", "");
	
	local aDmgClauses = {};
	local aWords = StringManager.parseWords(sDamage);
	local i = 1;
	while aWords[i] do
		local aDiceString = {};
		
		while StringManager.isDiceString(aWords[i]) do
			table.insert(aDiceString, aWords[i]);
			i = i + 1;
		end
		if #aDiceString == 0 then
			break;
		end
		
		local aDamageTypes = {};
		while StringManager.contains(DataCommon.dmgtypes, aWords[i]) do
			table.insert(aDamageTypes, aWords[i]);
			i = i + 1;
		end
		if bMagic then
			table.insert(aDamageTypes, "magic");
		end
		
		local rDmgClause = {};
		rDmgClause.aDice, rDmgClause.nMod = StringManager.convertStringToDice(table.concat(aDiceString, " "));
		rDmgClause.dmgtype = table.concat(aDamageTypes, ",");
		table.insert(aDmgClauses, rDmgClause);
		
		if StringManager.contains({ "+", "plus" }, aWords[i]) then
			i = i + 1;
		end
	end
	
	-- Create weapon entries
	if bMelee then
		local nodeWeapon = nodeWeapons.createChild();
		if nodeWeapon then
			DB.setValue(nodeWeapon, "isidentified", "number", nItemID);
			DB.setValue(nodeWeapon, "shortcut", "windowreference", "item", "....inventorylist." .. nodeItem.getName());
			
			local sAttackAbility = "";
			local sDamageAbility = "base";
			if bFinesse then
				if DB.getValue(nodeChar, "abilities.strength.score", 10) < DB.getValue(nodeChar, "abilities.dexterity.score", 10) then
					sAttackAbility = "dexterity";
					sDamageAbility = "dexterity";
				end
			end
			
			DB.setValue(nodeWeapon, "name", "string", sName);
			DB.setValue(nodeWeapon, "type", "number", 0);
			DB.setValue(nodeWeapon, "properties", "string", sProps);

			DB.setValue(nodeWeapon, "attackstat", "string", sAttackAbility);
			DB.setValue(nodeWeapon, "attackbonus", "number", nBonus);

			local nodeDmgList = DB.createChild(nodeWeapon, "damagelist");
			if nodeDmgList then
				for kClause,rClause in ipairs(aDmgClauses) do
					local nodeDmg = DB.createChild(nodeDmgList);
					if nodeDmg then
						DB.setValue(nodeDmg, "dice", "dice", rClause.aDice);
						if kClause == 1 then
							DB.setValue(nodeDmg, "stat", "string", sDamageAbility);
							DB.setValue(nodeDmg, "bonus", "number", nBonus + rClause.nMod);
						else
							DB.setValue(nodeDmg, "bonus", "number", rClause.nMod);
						end
						DB.setValue(nodeDmg, "type", "string", rClause.dmgtype);
					end
				end
			end
		end
	end

	if bRanged and not bThrown then
		local nodeWeapon = nodeWeapons.createChild();
		if nodeWeapon then
			DB.setValue(nodeWeapon, "isidentified", "number", nItemID);
			DB.setValue(nodeWeapon, "shortcut", "windowreference", "item", "....inventorylist." .. nodeItem.getName());
			
			local sAttackAbility = "";
			local sDamageAbility = "base";
				
			DB.setValue(nodeWeapon, "name", "string", sName);
			DB.setValue(nodeWeapon, "type", "number", 1);
			DB.setValue(nodeWeapon, "properties", "string", sProps);

			DB.setValue(nodeWeapon, "attackstat", "string", sAttackAbility);
			DB.setValue(nodeWeapon, "attackbonus", "number", nBonus);

			local nodeDmgList = DB.createChild(nodeWeapon, "damagelist");
			if nodeDmgList then
				for kClause,rClause in ipairs(aDmgClauses) do
					local nodeDmg = DB.createChild(nodeDmgList);
					if nodeDmg then
						DB.setValue(nodeDmg, "dice", "dice", rClause.aDice);
						if kClause == 1 then
							DB.setValue(nodeDmg, "stat", "string", sDamageAbility);
							DB.setValue(nodeDmg, "bonus", "number", nBonus + rClause.nMod);
						else
							DB.setValue(nodeDmg, "bonus", "number", rClause.nMod);
						end
						DB.setValue(nodeDmg, "type", "string", rClause.dmgtype);
					end
				end
			end
		end
	end
	
	if bThrown then
		local nodeWeapon = nodeWeapons.createChild();
		if nodeWeapon then	
			DB.setValue(nodeWeapon, "isidentified", "number", nItemID);
			DB.setValue(nodeWeapon, "shortcut", "windowreference", "item", "....inventorylist." .. nodeItem.getName());
			
			local sAttackAbility = "";
			local sDamageAbility = "base";
			if bFinesse then
				if DB.getValue(nodeChar, "abilities.strength.score", 10) < DB.getValue(nodeChar, "abilities.dexterity.score", 10) then
					sAttackAbility = "dexterity";
					sDamageAbility = "dexterity";
				end
			end
				
			DB.setValue(nodeWeapon, "name", "string", sName);
			DB.setValue(nodeWeapon, "type", "number", 2);
			DB.setValue(nodeWeapon, "properties", "string", sProps);

			DB.setValue(nodeWeapon, "attackstat", "string", sAttackAbility);
			DB.setValue(nodeWeapon, "attackbonus", "number", nBonus);

			local nodeDmgList = DB.createChild(nodeWeapon, "damagelist");
			if nodeDmgList then
				for kClause,rClause in ipairs(aDmgClauses) do
					local nodeDmg = DB.createChild(nodeDmgList);
					if nodeDmg then
						DB.setValue(nodeDmg, "dice", "dice", rClause.aDice);
						if kClause == 1 then
							DB.setValue(nodeDmg, "stat", "string", sDamageAbility);
							DB.setValue(nodeDmg, "bonus", "number", nBonus + rClause.nMod);
						else
							DB.setValue(nodeDmg, "bonus", "number", rClause.nMod);
						end
						DB.setValue(nodeDmg, "type", "string", rClause.dmgtype);
					end
				end
			end
		end
	end
end

function addToArmorDB(nodeChar, nodeItem)
	-- Parameter validation
	local bIsArmor, _, sSubtypeLower = ItemManager2.isArmor(nodeItem);
	if not bIsArmor then
		return;
	end
	local bIsShield = (sSubtypeLower == "shield");
	
	-- Determine whether to auto-equip armor
	local bArmorAllowed = true;
	local bShieldAllowed = true;

	if CharManager.hasFeature(nodeChar, FEATURE_UNARMORED_DEFENSE) then
		bArmorAllowed = false;
		
		for _,v in pairs(DB.getChildren(nodeChar, "classes")) do
			local sClassName = StringManager.trim(DB.getValue(v, "name", "")):lower();
			if (sClassName == CLASS_BARBARIAN) then
				break;
			elseif (sClassName == CLASS_MONK) then
				bShieldAllowed = false;
				break;
			end
		end
	end
	if CharManager.hasTrait(nodeChar, TRAIT_NATURAL_ARMOR) then
		bArmorAllowed = false;
		bShieldAllowed = true;
	end
	if CharManager.hasFeat(nodeChar, FEAT_DRAGON_HIDE) then
		bArmorAllowed = false;
		bShieldAllowed = true;
	end
	if (bArmorAllowed and not bIsShield) or (bShieldAllowed and bIsShield) then
		local bArmorEquipped = false;
		local bShieldEquipped = false;
		for _,v in pairs(DB.getChildren(nodeItem, "..")) do
			if DB.getValue(v, "carried", 0) == 2 then
				local bIsItemArmor, _, sItemSubtypeLower = ItemManager2.isArmor(v);
				if bIsItemArmor then
					if (sItemSubtypeLower == "shield") then
						bShieldEquipped = true;
					else
						bArmorEquipped = true;
					end
				end
			end
		end
		if bShieldAllowed and bIsShield and not bShieldEquipped then
			DB.setValue(nodeItem, "carried", "number", 2);
		elseif bArmorAllowed and not bIsShield and not bArmorEquipped then
			DB.setValue(nodeItem, "carried", "number", 2);
		end
	end
end

function calcItemArmorClass(nodeChar)
	local nMainArmorTotal = 0;
	local nNaturalArmorTotal = 0;
	local nMainShieldTotal = 0;
	local sMainDexBonus = "";
	local nMainStealthDis = 0;
	local nMainStrRequired = 0;

	local nodeNaturalArmor = getTraitRecord(nodeChar, TRAIT_NATURAL_ARMOR);
	if nodeNaturalArmor then
		local sNaturalArmorDesc = DB.getText(nodeNaturalArmor, "text", ""):lower();
		if sNaturalArmorDesc:match("your dexterity modifier doesn't affect this number") then
			sMainDexBonus = "no";
		end
		local sNaturalArmorTotal = sNaturalArmorDesc:match("your ac is (%d+)");
		if not sNaturalArmorTotal then
			sNaturalArmorTotal = sNaturalArmorDesc:match("base ac of (%d+)");
		end
		if sNaturalArmorTotal then
			nNaturalArmorTotal = (tonumber(sNaturalArmorTotal) or 10) - 10;
		end
	end
	local nodeDragonHide = CharManager.getFeatRecord(nodeChar, FEAT_DRAGON_HIDE);
	if nodeDragonHide then
		local sNaturalArmorDesc = DB.getText(nodeDragonHide, "text", ""):lower();
		local sNaturalArmorTotal = sNaturalArmorDesc:match("your ac as (%d+)");
		if sNaturalArmorTotal then
			local nNewNaturalArmorTotal = (tonumber(sNaturalArmorTotal) or 10) - 10;
			nNaturalArmorTotal = math.max(nNaturalArmorTotal, nNewNaturalArmorTotal);
		end
	end

	for _,vNode in pairs(DB.getChildren(nodeChar, "inventorylist")) do
		if DB.getValue(vNode, "carried", 0) == 2 then
			local bIsArmor, _, sSubtypeLower = ItemManager2.isArmor(vNode);
			if bIsArmor then
				local bID = LibraryData.getIDState("item", vNode, true);
				
				local bIsShield = (sSubtypeLower == "shield");
				if bIsShield then
					if bID then
						nMainShieldTotal = nMainShieldTotal + DB.getValue(vNode, "ac", 0) + DB.getValue(vNode, "bonus", 0);
					else
						nMainShieldTotal = nMainShieldTotal + DB.getValue(vNode, "ac", 0);
					end
				else
					local bLightArmor = false;
					local bMediumArmor = false;
					local bHeavyArmor = false;
					local sSubType = DB.getValue(vNode, "subtype", "");
					if sSubType:lower():match("^heavy") then
						bHeavyArmor = true;
					elseif sSubType:lower():match("^medium") then
						bMediumArmor = true;
					else
						bLightArmor = true;
					end
					
					if bID then
						nMainArmorTotal = nMainArmorTotal + (DB.getValue(vNode, "ac", 0) - 10) + DB.getValue(vNode, "bonus", 0);
					else
						nMainArmorTotal = nMainArmorTotal + (DB.getValue(vNode, "ac", 0) - 10);
					end
					
					if sMainDexBonus ~= "no" then
						local sItemDexBonus = DB.getValue(vNode, "dexbonus", ""):lower();
						if sItemDexBonus:match("yes") then
							local nMaxBonus = tonumber(sItemDexBonus:match("max (%d)")) or 0;
							if nMaxBonus == 2 then
								-- TODO: Remove until class SPECIALIZATION is completed					
								--if hasFeat(nodeChar, FEAT_MEDIUM_ARMOR_MASTER) and bMediumArmor then
								--	if sMainDexBonus == "" then
								--		sMainDexBonus = "max3";
								--	end
								--else
								--	if sMainDexBonus == "" or sMainDexBonus == "max3" then
								--		sMainDexBonus = "max2";
								--	end
								--end
							elseif nMaxBonus == 3 then
								if sMainDexBonus == "" then
									sMainDexBonus = "max3";
								end
							end
						else
							sMainDexBonus = "no";
						end
					end
					
					local sItemStealth = DB.getValue(vNode, "stealth", ""):lower();
					-- TODO: Remove until class SPECIALIZATION is completed
					--if sItemStealth == "disadvantage" then
						--if hasFeat(nodeChar, FEAT_MEDIUM_ARMOR_MASTER) and bMediumArmor then
							-- NOTE: Do not apply stealth disadvantage from armor in this case
						--else
						--	nMainStealthDis = 1;
						--end
					--end
					
					local sItemStrength = StringManager.trim(DB.getValue(vNode, "strength", "")):lower();
					local nItemStrRequired = tonumber(sItemStrength:match("str (%d+)")) or 0;
					if nItemStrRequired > 0 then
						nMainStrRequired = math.max(nMainStrRequired, nItemStrRequired);
					end
				end
			end
		end
	end
	
	nMainArmorTotal = math.max(nMainArmorTotal, nNaturalArmorTotal);
	
	DB.setValue(nodeChar, "defenses.ac.armor", "number", nMainArmorTotal);
	DB.setValue(nodeChar, "defenses.ac.shield", "number", nMainShieldTotal);
	DB.setValue(nodeChar, "defenses.ac.dexbonus", "string", sMainDexBonus);
	DB.setValue(nodeChar, "defenses.ac.disstealth", "number", nMainStealthDis);
end

function applyTough(nodeChar, bInitialAdd)
	local nAddHP = 2;
	if bInitialAdd then
		nAddHP = 0;
		for _,nodeChild in pairs(DB.getChildren(nodeChar, "classes")) do
			local nLevel = DB.getValue(nodeChild, "level", 0);
			if nLevel > 0 then
				nAddHP = nAddHP + (2 * nLevel);
			end
		end
	end
	
	local nHP = DB.getValue(nodeChar, "hp.total", 0);
	nHP = nHP + nAddHP;
	DB.setValue(nodeChar, "hp.total", "number", nHP);
	
	outputUserMessage("char_abilities_message_hpaddfeat", StringManager.capitalizeAll(FEAT_TOUGH), DB.getValue(nodeChar, "name", ""), nAddHP);
end

function addItemToList(vList, sClass, vSource, bTransferAll, nTransferCount)
	-- Get the source item database node object
	local nodeSource = nil;
	if type(vSource) == "databasenode" then
		nodeSource = vSource;
	elseif type(vSource) == "string" then
		nodeSource = DB.findNode(vSource);
	end
	local nodeList = nil;
	if type(vList) == "databasenode" then
		nodeList = vList;
	elseif type(vList) == "string" then
		nodeList = DB.createNode(vList);
	end
	if not nodeSource or not nodeList then
		return nil;
	end
	
	-- Determine the source and target item location type
	local sSourceRecordType = ItemManager.getItemSourceType(nodeSource);
	local sTargetRecordType = ItemManager.getItemSourceType(nodeList);
	
	-- Make sure that the source and target locations are not the same character
	if sSourceRecordType == "charsheet" and sTargetRecordType == "charsheet" then
		if nodeSource.getParent().getNodeName() == nodeList.getNodeName() then
			return nil;
		end
	end
	
	-- Use a temporary location to create an item copy for manipulation, if the item type is supported
	local sTempPath;
	if nodeList.getParent() then
		sTempPath = nodeList.getParent().getPath("temp.item");
	else
		sTempPath = "temp.item";
	end
	DB.deleteNode(sTempPath);
	local nodeTemp = DB.createNode(sTempPath);
	local bCopy = false;
	if sClass == "item" then
		DB.copyNode(nodeSource, nodeTemp);
		bCopy = true;
	elseif ItemManager2 and ItemManager2.addItemToList2 then
		bCopy = ItemManager2.addItemToList2(sClass, nodeSource, nodeTemp, nodeList);
	end
	
	local nodeNew = nil;
	if bCopy then
		-- Determine target node for source item data.  
		-- If we already have an item with the same fields, then just append the item count.  
		-- Otherwise, create a new item and copy from the source item.
		local bAppend = false;
		if sTargetRecordType ~= "item" then
			for _,vItem in pairs(DB.getChildren(nodeList, "")) do
				if ItemManager.compareFields(vItem, nodeTemp, true) then
					nodeNew = vItem;
					bAppend = true;
					break;
				end
			end
		end
		if not nodeNew then
			nodeNew = DB.createChild(nodeList);
			if sTargetRecordType == "charsheet" and User.isLocal() then
				DB.setValue(nodeTemp, "isidentified", "number", 1);
			end
			DB.copyNode(nodeTemp, nodeNew);
		end
		
		-- Determine the source, target and item names
		local sSrcName, sTrgtName;
		if sSourceRecordType == "charsheet" then
			sSrcName = DB.getValue(nodeSource, "...name", "");
		elseif sSourceRecordType == "partysheet" then
			sSrcName = "PARTY";
		else
			sSrcName = "";
		end
		if sTargetRecordType == "charsheet" then
			sTrgtName = DB.getValue(nodeNew, "...name", "");
		elseif sTargetRecordType == "partysheet" then
			sTrgtName = "PARTY";
		else
			sTrgtName = "";
		end
		local sItemName = ItemManager.getDisplayName(nodeNew, true);

		-- Determine whether to copy all items at once or just one item at a time (based on source and target)

		local nCount = 1;
		if nTransferCount then
			nCount = nTransferCount;
		end
		if bAppend then
			local nAppendCount = math.max(DB.getValue(nodeNew, "count", 1), 1);
			DB.setValue(nodeNew, "count", "number", nCount + nAppendCount);
		else
			DB.setValue(nodeNew, "count", "number", nCount);
		end

		-- If not adding to an existing record, then lock the new record and generate events
		if not bAppend then
			DB.setValue(nodeNew, "locked", "number", 1);
			if sTargetRecordType == "charsheet" then
				ItemManager.onCharAddEvent(nodeNew);
			end
		end

		-- Generate output message if transferring between characters or between party sheet and character
		if sSourceRecordType == "charsheet" and (sTargetRecordType == "partysheet" or sTargetRecordType == "charsheet") then
			local msg = {font = "msgfont", icon = "coins"};
			msg.text = "[" .. sSrcName .. "] -> [" .. sTrgtName .. "] : " .. sItemName;
			if nCount > 1 then
				msg.text = msg.text .. " (" .. nCount .. "x)";
			end
			Comm.deliverChatMessage(msg);

			local nCharCount = DB.getValue(nodeSource, "count", 0);
			if nCharCount <= nCount then
				ItemManager.onCharRemoveEvent(nodeSource);
				nodeSource.delete();
			else
				DB.setValue(nodeSource, "count", "number", nCharCount - nCount);
			end
		elseif sSourceRecordType == "partysheet" and sTargetRecordType == "charsheet" then
			local msg = {font = "msgfont", icon = "coins"};
			msg.text = "[" .. sSrcName .. "] -> [" .. sTrgtName .. "] : " .. sItemName;
			if nCount > 1 then
				msg.text = msg.text .. " (" .. nCount .. "x)";
			end
			Comm.deliverChatMessage(msg);

			local nPartyCount = DB.getValue(nodeSource, "count", 0);
			if nPartyCount <= nCount then
				nodeSource.delete();
			else
				DB.setValue(nodeSource, "count", "number", nPartyCount - nCount);
			end
		end
	end
	
	-- Clean up
	DB.deleteNode(sTempPath);

	return nodeNew;
end

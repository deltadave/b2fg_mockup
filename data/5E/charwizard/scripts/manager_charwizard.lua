-- 
-- Please see the license.html file included with this distribution for 
-- attribution and copyright information.
--

genmethod = {
	"STANDARD ARRAY",
	"POINT BUY",
	"DICE ROLL",
	"MANUAL ENTRY",
};

local sAbilityGenMethod = "";
local aAbilityGenScores = {};

function getAbilityScores()
	return sAbilityGenMethod, aAbilityGenScores;
end

function setAbilityScores(sMethod, aAbilityScores)
	sAbilityGenMethod = sMethod;
	aAbilityScores = aAbilityScores or {};
	
	updateSummary();
end

function updateSummary()
	local wWizard = getWizardWindow();
	local wSummary = wWizard.summary_subwindow.subwindow;
	wSummary.update();
end

function getWizardWindow()
	local window = Interface.findWindow("charwizard", "");
	return window;
end

function impCharacter(nodeChar)
	setLevelUpUI();
	impAbilitiesDB2CR(nodeChar);
	impClassesDB2CR(nodeChar);
	--impInventoryDB2CR(nodeChar);
	setSummary(nodeChar);
end

function impAbilitiesDB2CR(nodeChar)
	CampaignRegistry.charwizard.import = true;
	CampaignRegistry.charwizard.abilities = {};
	for k,vAbilityScore in pairs(DB.getChildren(nodeChar, "abilities", "")) do
		if k == "strength" then
			CampaignRegistry.charwizard.abilities.genval1 = DB.getValue(vAbilityScore, "score", 0);
		elseif k == "dexterity" then
			CampaignRegistry.charwizard.abilities.genval2 = DB.getValue(vAbilityScore, "score", 0);			
		elseif k == "constitution" then
			CampaignRegistry.charwizard.abilities.genval3 = DB.getValue(vAbilityScore, "score", 0);
		elseif k == "intelligence" then
			CampaignRegistry.charwizard.abilities.genval4 = DB.getValue(vAbilityScore, "score", 0);
		elseif k == "wisdom" then
			CampaignRegistry.charwizard.abilities.genval5 = DB.getValue(vAbilityScore, "score", 0);
		elseif k == "charisma" then
			CampaignRegistry.charwizard.abilities.genval6 = DB.getValue(vAbilityScore, "score", 0);
		end
	end
end

function impClassesDB2CR(nodeChar)
	CampaignRegistry.charwizard.classes = {};
	CampaignRegistry.charwizard.impclasses = {};
	local wWizard = getWizardWindow();
	local aClasses = {};
	local aImpClasses = {};	
	local nSpellCasterLevel = 0;
	local nPactCasterLevel = 0;
	for k,vClass in pairs(DB.getChildren(nodeChar, "classes", "")) do
		local bSpellcaster = true;
		local sClassName = DB.getValue(vClass, "name", "");
		local sClass, sRecord = DB.getValue(vClass, "shortcut", "");
		local nLevel = tonumber(DB.getValue(vClass, "level", ""));
		local bSpec = false;
		if vClass.casterlevelinvmult == 0 and vClass.casterpactmagic == 0 then
			bSpellcaster = false;
		end
		table.insert(aClasses, {main = false, name = string.lower(sClassName), spellcaster = 0, record = sRecord, class = sClass, level = nLevel, spec = ""});
		--table.insert(aImpClasses, {main = false, name = string.lower(sClassName), spellcaster = bSpellcaster, record = sRecord, class = sClass, level = nLevel, casterlevel = 0, pactlevel = 0, spec = ""});		
	end
	CampaignRegistry.charwizard.classes = aClasses;
	wWizard.setSpellcasterCode();
	for _,vImpClass in pairs (CampaignRegistry.charwizard.classes) do
		table.insert(aImpClasses, {main = false, name = string.lower(vImpClass.name), spellcaster = vImpClass.spellcaster, record = vImpClass.record, class = vImpClass.class, level = vImpClass.level, casterlevel = wWizard.calcSpellcastingLevel(false), pactlevel = wWizard.calcPactMagicLevel(false), spec = ""});
	end
	CampaignRegistry.charwizard.impclasses = aImpClasses;

	if bSpellcaster then
		nSpellCasterLevel = wWizard.calcSpellcastingLevel(true);
		nPactCasterLevel = wWizard.calcPactMagicLevel(true);			
	end	
	
	if nSpellCasterLevel > 0 and CampaignRegistry.charwizard.impclasses then
		CampaignRegistry.charwizard.impclasses.casterlevel = nSpellCasterLevel;
	end
	if nPactCasterLevel > 0 and CampaignRegistry.charwizard.impclasses then
		CampaignRegistry.charwizard.impclasses.pactlevel = nPactCasterLevel;
	end	
end

function impInventoryDB2CR(nodeChar)
	local aItemList = {};
	for _,vItem in pairs (DB.getChildren(nodeChar, "inventorylist")) do
		local sItemClass, sItemRecord = DB.findNode(vItem);
		table.insert(aItemList, {name = DB.getValue(vItem, "name", ""), carried = DB.getValue(vItem, "carried", ""), count = DB.getValue(vItem, "count", "")});
	end
end

function setLevelUpUI()
	local wWizard = getWizardWindow();
	wWizard.charwizard_racetab.setEnabled(false);
	wWizard.charwizard_racetab.setFrame("buttondisabled", "5,5,5,5");
	wWizard.race_alert.setVisible(false);
	wWizard.race_GateCheck.setVisible(false);
	wWizard.charwizard_statstab.setEnabled(false);	
	wWizard.charwizard_statstab.setFrame("buttondisabled", "5,5,5,5");
	wWizard.ability_alert.setVisible(false);
	wWizard.ability_GateCheck.setVisible(false);
	wWizard.class_alert.setVisible(false);
	wWizard.class_GateCheck.setVisible(false);
	wWizard.charwizard_backtab.setEnabled(false);
	wWizard.charwizard_backtab.setFrame("buttondisabled", "5,5,5,5");
	wWizard.background_alert.setVisible(false);
	wWizard.background_GateCheck.setVisible(false);
end

function setSummary(nodeChar)
	local wWizard = getWizardWindow();
	local sRaceClass, sRaceRecord = DB.getValue(nodeChar, "racelink", "");
	local aSpecializations = {};
	wWizard.summary.subwindow.summary_identity.setValue(nodeChar.getNodeName());
	wWizard.name.setValue(DB.getValue(nodeChar, "name", ""));
	wWizard.summary.subwindow.summary_name.setValue(DB.getValue(nodeChar, "name", ""));
	wWizard.summary.subwindow.summary_race.setValue(string.upper(DB.getValue(nodeChar, "race", "")));
	wWizard.summary.subwindow.summary_background.setValue(string.upper(DB.getValue(nodeChar, "background", "")));
	wWizard.summary.subwindow.summary_senses.setValue(DB.getValue(nodeChar, "senses", ""));	
	wWizard.summary.subwindow.summary_size.setValue(DB.getValue(nodeChar, "size", ""));
	wWizard.summary.subwindow.summary_speed.setValue(DB.getValue(nodeChar, "speed.total", ""));

	for k,vAbilityScore in pairs(DB.getChildren(nodeChar, "abilities", "")) do
		if k == "strength" then
			wWizard.summary.subwindow.summary_genval1.setValue(CampaignRegistry.charwizard.abilities.genval1);
		elseif k == "dexterity" then
			wWizard.summary.subwindow.summary_genval2.setValue(CampaignRegistry.charwizard.abilities.genval2);
		elseif k == "constitution" then
			wWizard.summary.subwindow.summary_genval3.setValue(CampaignRegistry.charwizard.abilities.genval3);			
		elseif k == "intelligence" then
			wWizard.summary.subwindow.summary_genval4.setValue(CampaignRegistry.charwizard.abilities.genval4);			
		elseif k == "wisdom" then
			wWizard.summary.subwindow.summary_genval5.setValue(CampaignRegistry.charwizard.abilities.genval5);			
		elseif k == "charisma" then
			wWizard.summary.subwindow.summary_genval6.setValue(CampaignRegistry.charwizard.abilities.genval6);			
		end
	end

	for _,vProficiency in pairs(DB.getChildren(nodeChar, "proficiencylist")) do
		wndProficiency = wWizard.summary.subwindow.summary_proficiencies.createWindow();
		wndProficiency.name.setValue(DB.getValue(vProficiency, "name", ""));
	end

	for _,vSkill in pairs(DB.getChildren(nodeChar, "skilllist")) do
		if DB.getValue(vSkill, "prof") == 1 then
			wndSkill = wWizard.summary.subwindow.summary_skills.createWindow();
			wndSkill.name.setValue(DB.getValue(vSkill, "name", ""));
		end
	end

	for _,vLanguage in pairs(DB.getChildren(nodeChar, "languagelist")) do
		wndLanguage = wWizard.summary.subwindow.summary_languages.createWindow();
		wndLanguage.language.setValue(DB.getValue(vLanguage, "name", ""));
	end

	for _,vTrait in pairs(DB.getChildren(nodeChar, "traitlist")) do
		wndTrait = wWizard.summary.subwindow.summary_traits.createWindow();
		wndTrait.name.setValue(DB.getValue(vTrait, "name", ""));
	end

	for _,vClass in pairs(DB.getChildren(nodeChar, "classes")) do
		wndClass = wWizard.summary.subwindow.summary_class.createWindow();
		wndClass.classname.setValue(string.upper(DB.getValue(vClass, "name", "")));
		wndClass.classlink.setValue(string.upper(DB.getValue(vClass, "shortcut", "")));
		wndClass.classlevel.setValue(string.upper(DB.getValue(vClass, "level", "")));
	end

	for _,vFeature in pairs(DB.getChildren(nodeChar, "featurelist")) do
		if DB.getValue(vFeature, "specialization", "") ~= "" then
			local sSpecialization = string.upper(DB.getValue(vFeature, "specialization"));
			if not StringManager.contains(aSpecializations, sSpecialization) then
				table.insert(aSpecializations, sSpecialization);
			end
		end
	end
	for i=1,#aSpecializations do
		wndSpecialization = wWizard.summary.subwindow.summary_specialization.createWindow();
		wndSpecialization.classname.setValue(aSpecializations[i]);
	end
end	

function getLevelRange(wndCurrent, nLevel, nNew)
	local nMinLevel = 0;
	local nMaxLevel = 20;
	if not nNew then
		nNew = 0;
	end
	local aMaxLevelAvailable = {};
	if nLevel then
		for _,vClass in pairs(CampaignRegistry.charwizard.impclasses) do
			nMaxLevel = nMaxLevel - vClass.level;
		end
		nMinLevel = nLevel + 1;		
	else
		nMinLevel = 1;
	end
	for i=nMinLevel,(nMaxLevel + nLevel - nNew) do
		table.insert(aMaxLevelAvailable, tostring(i));
	end
	return aMaxLevelAvailable;
end
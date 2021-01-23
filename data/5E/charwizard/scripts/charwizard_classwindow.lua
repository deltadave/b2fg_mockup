-- 
-- Please see the license.html file included with this distribution for 
-- attribution and copyright information.
--

function onInit()
	createClassLabels();

end

function createClassLabels()
	if CampaignRegistry.charwizard.import then
		createLevelUpLabels();
		return;
	end
	local w = createWindow();
	w.group_name.setValue("SELECT CLASS");
	w.group.setValue(1);
	createClassList(1, w);
	local wndSummary = Interface.findWindow("charwizard", "");	
	getClassAlerts(wndSummary)
end	
	
function createLevelUpLabels()
	local nGroup = 1;
	for k,vClass in pairs(CampaignRegistry.charwizard.classes) do
		local w = createWindow();
		w.button_expand_classes.setVisible(false);
		w.group_name.setValue("INCREASE LEVEL");
		w.group.setValue(nGroup);
		w.selection_name.setValue(string.upper(vClass.name));
		w.selection_name.setVisible(true);
		w.selection_shortcut.setValue(vClass.class, vClass.record);
		w.level.setValue(vClass.level);
		w.level.setVisible(true);
		w.level.clear();
		w.level.addItems(CharWizardManager.getLevelRange(w, vClass.level));
		nGroup = nGroup + 1;
	end
	for _,vClassWindow in pairs(getWindows()) do
		if vClassWindow.group_name.getValue() == "SELECT SPECIALIZATION" then
			vClassWindow.close();
		end
	end
	local wndMultiClass = createWindow();
	createClassList(nGroup, wndMultiClass);
	wndMultiClass.group_name.setValue("SELECT MULTICLASS");				
	wndMultiClass.group.setValue(nGroup);
	wndMultiClass.selection_window.setVisible(false);	
end

function createClassList(nGroup, w)
	aSelectedClasses = {};
	if nGroup > 1 then
		for _,vGroup in pairs(getWindows()) do
			if vGroup.group_name.getValue() == "SELECT CLASS" or vGroup.group_name.getValue() == "SELECT MULTICLASS" or vGroup.group_name.getValue() == "INCREASE LEVEL" then
				if vGroup.selection_name.getValue() ~= "" then
					table.insert(aSelectedClasses, string.lower(vGroup.selection_name.getValue()));
				end
			end
		end
	end
	local aClassCheck = {};	
	local aMappings = LibraryData.getMappings("class");
	for _,vMapping in ipairs(aMappings) do
		-- If Tashas is loaded load those classes first, otherwise load the PHB classes first.
		local aTashas = Module.getModuleInfo("DD Tashas Cauldron of Everything - Players");
		if aTashas and aTashas.loaded then
			for _,vPHBClass in pairs(DB.getChildrenGlobal(vMapping)) do
				local sPHBClassLower = StringManager.trim(DB.getValue(vPHBClass, "name", "")):lower();
				local sPHBClassLink = vPHBClass.getPath();
				if string.match(sPHBClassLink, "DD Tashas") and string.match(sPHBClassLink, "Player") then
					table.insert(aClassCheck, sPHBClassLower);
					if not StringManager.contains(aSelectedClasses, sPHBClassLower) then
						local wndSubwindow = w.selection_window.createWindow();
						wndSubwindow.name.setValue(sPHBClassLower);
						local sPHBClassCapitalized = StringManager.capitalizeAll(sPHBClassLower);
						wndSubwindow.bname.setText(sPHBClassCapitalized);
						wndSubwindow.group.setValue(nGroup);
						wndSubwindow.shortcut.setValue("reference_class", sPHBClassLink);
					end
				end
			end
		else
			for _,vPHBClass in pairs(DB.getChildrenGlobal(vMapping)) do	
				local sPHBClassLower = StringManager.trim(DB.getValue(vPHBClass, "name", "")):lower();
				local sPHBClassLink = vPHBClass.getPath();
				if string.match(sPHBClassLink, "DD PHB Deluxe") then
					table.insert(aClassCheck, sPHBClassLower);
					if not StringManager.contains(aSelectedClasses, sPHBClassLower) then
						local wndSubwindow = w.selection_window.createWindow();
						wndSubwindow.name.setValue(sPHBClassLower);
						local sPHBClassCapitalized = StringManager.capitalizeAll(sPHBClassLower);
						wndSubwindow.bname.setText(sPHBClassCapitalized);
						wndSubwindow.group.setValue(nGroup);
						wndSubwindow.shortcut.setValue("reference_class", sPHBClassLink);
					end
				end
			end
		end
		-- Load all other classes ignoring their version of base classes.
		for _,vClass in pairs(DB.getChildrenGlobal(vMapping)) do	
			local sClassLower = StringManager.trim(DB.getValue(vClass, "name", "")):lower();
			local sClassLink = vClass.getPath();
			if not StringManager.contains(aClassCheck, sClassLower) then
				table.insert(aClassCheck, sClassLower);
				local wndSubwindow = w.selection_window.createWindow();
				wndSubwindow.name.setValue(sClassLower);
				local sClassCapitalized = StringManager.capitalizeAll(sClassLower);
				wndSubwindow.bname.setText(sClassCapitalized);
				wndSubwindow.group.setValue(nGroup);				
				wndSubwindow.shortcut.setValue("reference_class", sClassLink);
			end
		end
	end
	applySort();
end

function createAbilities(w)
	for _,vAbility in pairs(DataCommon.abilities) do
		local wndAbility = w.selection_window.createWindow();
		wndAbility.name.setValue(vAbility);
		wndAbility.bname.setText(StringManager.capitalize(vAbility));
	end
end

function createFeatureWindows(nodeSource, sGroup, nLevel, sPrevLevel, sSelectionRecord)
	local wndSummary = Interface.findWindow("charwizard", "");
	local aProfList = {};
	local aFeatList = {};
	local nGroup = tonumber(sGroup);
	local nPrevLevel = 0;
	local bExpertise = false;
	local bOptions = false;
	if CampaignRegistry.charwizard.import then
		nPrevLevel = tonumber(sPrevLevel);
	end

	-- Basic Class Features for all Classes
	if nLevel == 1 and nPrevLevel == 0 then 
		if nGroup == 1 then
			for _,vProf in pairs(DB.getChildren(nodeSource, "proficiencies")) do
				table.insert(aProfList, vProf);
			end
		else
			for _,vMultiProf in pairs(DB.getChildren(nodeSource, "multiclassproficiencies")) do
				table.insert(aProfList, vMultiProf);
			end		
		end
		for _,vProficiencies in pairs(aProfList) do
			if DB.getValue(vProficiencies, "name", ""):lower() == "skills" then
				local aLimitedSkills = {};
				local sAdjust = DB.getText(vProficiencies, "text", ""):lower();
				local bLimited = sAdjust:match("from");
				local bChoice = sAdjust:match("choose");
				local nSkillChoices = 1;
				
				if bLimited then
					local sSkillText = sAdjust:match("from ([^.]+)");
					sSkillText = sSkillText:gsub("or ", "");
					sSkillText = sSkillText:gsub("and ", "");				
					for s in string.gmatch(sSkillText, "(%a[%a%s]+)%,?") do
						table.insert(aLimitedSkills, s);
					end
				end

				if nGroup == 1 then
					if sAdjust:match("four") then
						nSkillChoices = 4; 
					elseif sAdjust:match("three") then
						nSkillChoices = 3;
					else
						nSkillChoices = 2;
					end
				end

				if bChoice and not CampaignRegistry.charwizard.import then		
					local w = createWindow();
					w.group_name.setValue("SELECT SKILL PROFICIENCY");
					w.group.setValue(nGroup);						
					w.order.setValue(1);
					w.selection_shortcut.setVisible(false);
					w.selection_type.setValue(sSkillChoices);
					createSkills(vProficiencies, sGroup, w, sSkillChoices, aLimitedSkills);
					w.selection_name.setValue("CHOICES:");
					w.selection_name.setVisible(true);
					w.selection_count.setValue(nSkillChoices);
					w.selection_count.setVisible(true);
				end
			end
		end
		applySort();			
	end

	for _,v in pairs(DB.getChildren(nodeSource, "features")) do
		local sFeatureType = CampaignDataManager2.sanitize(DB.getValue(v, "name", ""));
		local nFeatureLevel = tonumber(DB.getValue(v, "level", ""));
		if nFeatureLevel > nPrevLevel and nFeatureLevel <= nLevel then
			if sFeatureType == "" then
				sFeatureType = nodeSource.getName();
			end
			
			if (DB.getValue(v, "specializationchoice", 0) == 1) then
				createSpecialization(sGroup, sSelectionRecord);
			end
			
			if sFeatureType == "abilityscoreimprovement" then
				aFeatList = updateFeats();
			end
			-- Rogue Expertise
			-- Rogue Expertise Feature window is created after all methods of selecting skills are complete (i.e., Race, Class, and Background)

			-- Tashas Class Options
			if string.match(v.getPath(), "_option") then
				bOptions = true;
			end
		end
	end
	if bOptions then
		createTashaClassOptions(nodeSource, nLevel, nGroup);
	end
	if #aFeatList > 0 then
		updateASI(wndSummary, aFeatList);
	end
end

function createTashaClassOptions(nodeSource, nLevel, nGroup)
	-- Tashas Class Options
	local wndSummary = Interface.findWindow("charwizard", "");
	local nodeFeature;
	local nFeatureLevel = 0;
	for _,wClassOptions in pairs(getWindows()) do
		if wClassOptions.group_name.getValue() == "SELECT TASHA CLASS OPTIONS" and nGroup == wClassOptions.group.getValue() then
			wClassOptions.close();
		end
	end

	local w = createWindow();
	local aClassOptions = {};
	local aOptionName = {};	
	w.group_name.setValue("SELECT TASHA CLASS OPTIONS");
	w.group.setValue(nGroup);						
	w.order.setValue(9);
	w.selection_shortcut.setVisible(false);	
	applySort();
	for _,v in pairs(DB.getChildren(nodeSource, "features")) do
		if string.match(v.getPath(), "_option") and tonumber(DB.getValue(v, "level", "")) <= nLevel then
			if not StringManager.contains(aOptionName, StringManager.trim(DB.getValue(v, "name", "")):lower()) then
				table.insert(aClassOptions, {name = StringManager.trim(DB.getValue(v, "name", "")):lower(), level = nLevel, path = v.getPath()});
				table.insert(aOptionName, StringManager.trim(DB.getValue(v, "name", "")):lower());
			end
		end
	end
	w.selection_window.setColumnWidth(200);
	for _,vClassOpt in pairs(aClassOptions) do
		local sReplacement = "";
		local sReplaceFeature = "";
		if string.match(vClassOpt.name, "replacement") then
			sReplacement = DB.getValue(DB.findNode(vClassOpt.path), "text", "")
			if sReplacement then
				sReplaceFeature = sReplacement:match("which replaces the ([^.]+) feature");				
				if sReplaceFeature:match("feature") then
					sReplaceFeature = sReplaceFeature:match("([^.]+) feature");
				end
			end
		end
		local sOptionName = vClassOpt.name:gsub(" %(option([^.]+)", "");
		local wndClassOpt = w.selection_window.createWindowWithClass("class_tashasclassoption_item");
		wndClassOpt.bname.setText(StringManager.capitalizeAll(sOptionName));
		wndClassOpt.name.setValue(StringManager.capitalizeAll(sOptionName));
		wndClassOpt.shortcut.setVisible(true);
		wndClassOpt.shortcut.setValue("reference_classfeature", vClassOpt.path);
		wndClassOpt.type.setValue(string.lower(sReplaceFeature));
	end
end

function createExpertise()
	local aSkills = {};
	local wndSummary = Interface.findWindow("charwizard", "");
	local nGroup = 1;
	local nLevel = 1;
	local nCount = 2;
	for _,vSkill in pairs(wndSummary.summary.subwindow.summary_skills.getWindows()) do
		table.insert(aSkills, vSkill.name.getValue());
	end
	for _,vClassWindow in pairs(getWindows()) do
		if vClassWindow.group_name.getValue() == "SELECT EXPERTISE" then
			vClassWindow.close();
		end
		if vClassWindow.selection_name.getValue() == "ROGUE" then
			nGroup = tonumber(vClassWindow.group.getValue());
			nLevel = tonumber(vClassWindow.level.getValue());
		end
	end
	if nLevel > 5 then
		nCount = 4;
	end
	local w = createWindow();
	w.group_name.setValue("SELECT EXPERTISE");
	w.group.setValue(nGroup);						
	w.order.setValue(2);
	w.selection_shortcut.setVisible(false);	
	w.selection_name.setValue("CHOICES:");
	w.selection_name.setVisible(true);
	w.selection_count.setValue(nCount);
	w.selection_count.setVisible(true);
	applySort();
	for _,vSkill in pairs(aSkills) do 
		local wndSkills = w.selection_window.createWindow();
		wndSkills.bname.setText(StringManager.capitalizeAll(vSkill));
		wndSkills.name.setValue(StringManager.capitalizeAll(vSkill));
		--wndSkills.type.setValue(sType);
		--wndSkills.group.setValue(sGroup);			
	end
	local wndSkills = w.selection_window.createWindow();
	wndSkills.bname.setText("Thieves' Tools");
	wndSkills.name.setValue("Thieves' Tools");
	--wndSkills.type.setValue(sType);
	--wndSkills.group.setValue(sGroup);	
end

function createSkills(sTrait, sGroup, w, sType, aLimitedSkills)
	local sText = DB.getText(sTrait, "text");
	local sSkills = sText:match("from ");

	if aLimitedSkills[1] then
		for _,vSkill in pairs(aLimitedSkills) do 
			local wndSkills = w.selection_window.createWindow();
			wndSkills.bname.setText(StringManager.capitalizeAll(vSkill));
			wndSkills.name.setValue(StringManager.capitalizeAll(vSkill));
			wndSkills.type.setValue(sType);
			wndSkills.group.setValue(sGroup);
		end		
	else
		for kSkill,_ in pairs(DataCommon.skilldata) do 
			local wndSkills = w.selection_window.createWindow();
			wndSkills.bname.setText(StringManager.capitalizeAll(kSkill));
			wndSkills.name.setValue(StringManager.capitalizeAll(kSkill));
			wndSkills.type.setValue(sType);
			wndSkills.group.setValue(sGroup);			
		end
	end
	getClassAlerts();
end

function createSpecialization(sGroup, sSelectionRecord)
	local nGroup = tonumber(sGroup);
	for _,vSpecWindow in pairs(getWindows()) do
		if vSpecWindow.group.getValue() == nGroup and vSpecWindow.group_name.getValue() == "SELECT SPECIALIZATION" then
			vSpecWindow.close();
		end
	end

	local nodeSource = DB.findNode(sSelectionRecord);
	local sClassName = DB.getValue(nodeSource, "name", "");
	local aSpecializationOptions = getClassSpecializationOptions(nodeSource);
	local w = createWindow();
	w.group.setValue(nGroup);
	w.order.setValue(8);				
	w.group_name.setValue("SELECT SPECIALIZATION");
	applySort();

	for _,vSpecialization in pairs(aSpecializationOptions) do
		local wndFeature = w.selection_window.createWindow();
		wndFeature.group.setValue(nGroup);
		local sSpec = string.lower(vSpecialization.text);
		sSpec = sSpec:gsub("path of the ", "");
		wndFeature.name.setValue(sSpec);
		wndFeature.class.setValue(sClassName);		
		wndFeature.bname.setText(StringManager.capitalizeAll(sSpec));
		applySort();
	end
	getClassAlerts();
end

function createTools(sTrait, w)
	local sText = DB.getText(sTrait, "text");
	local sTools = sText:match("choice: ([^.]+)");
	
	if not sTools then
		return false;
	end

	sTools = sTools:gsub(" or ", ",");
	sTools = sTools:gsub(",%s", ",");
	sTools = sTools:gsub(",,", ",");

	for vTool in string.gmatch(sTools, "([^,]+)") do 
		local wndTools = w.selection_window.createWindow();
		wndTools.bname.setText(StringManager.capitalize(vTool));
		wndTools.name.setValue(StringManager.capitalize(vTool));
	end	
end

function createLanguages(sTrait, w)
	local sText = DB.getText(sTrait, "text");
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
	sLanguages = sLanguages:gsub(", but you.*$", "");

	for vLanguage in string.gmatch(sLanguages, "([^,]+)") do 
		local wndLanguages = w.selection_window.createWindow();
		wndLanguages.bname.setText(StringManager.capitalize(vLanguage));
		wndLanguages.name.setValue(StringManager.capitalize(vLanguage));
	end	
end

function getLevelRange(wndCurrent, nLevel)
	local nMinLevel = 0;
	local nMaxLevel = 20;
	local aMaxLevelAvailable = {};
	for _,v in pairs(getWindows()) do
		if v.group_name.getValue() == "SELECT CLASS" or v.group_name.getValue() == "SELECT MULTICLASS" then
			if v ~= wndCurrent then
				nMaxLevel = nMaxLevel - tonumber(v.level.getValue());
			end
		end
	end
	if nLevel then
		for _,vClass in pairs(CampaignRegistry.charwizard.classes) do
			nMaxLevel = nMaxLevel - tonumber(vClass.level);
		end
		nMinLevel = nLevel + 1;		
	else
		nMinLevel = 1;
	end
	for i=nMinLevel,nMaxLevel do
		table.insert(aMaxLevelAvailable, tostring(i));
	end
	return aMaxLevelAvailable;
end

function parseSelection(sGroup, sSelectionGroup, sValue, sSelectionName, sSelectionClass, sSelectionRecord)
	local wndSummary = Interface.findWindow("charwizard", "");
	local nodeSource = DB.findNode(sSelectionRecord);

	nGroup = tonumber(sGroup);
	if sSelectionGroup == "SELECT CLASS" then
		wndSummary.closeSubType("skills", "class");
		for _,vSelectClass in pairs(getWindows()) do
			if vSelectClass.group_name.getValue() == "SELECT CLASS" then
				vSelectClass.selection_name.setValue(sSelectionName);
				vSelectClass.selection_shortcut.setValue(sSelectionClass, sSelectionRecord);
				vSelectClass.selection_name.setVisible(true);
				vSelectClass.selection_shortcut.setVisible(true);
				vSelectClass.level_label.setVisible(true);
				vSelectClass.level.setValue(1);
				vSelectClass.level.setVisible(true);
			else
				vSelectClass.close();
			end
			if CampaignRegistry.charwizard.feats and CampaignRegistry.charwizard.feats.class then
				CampaignRegistry.charwizard.feats.class = {};
			end
			wndSummary.summary.subwindow.summary_class.closeAll();
			wndSummary.summary.subwindow.summary_specialization.closeAll();			
		end
		local wndMultiClass = createWindow();
		createClassList(2, wndMultiClass);
		wndMultiClass.group_name.setValue("SELECT MULTICLASS");				
		wndMultiClass.group.setValue(2);
		wndMultiClass.selection_window.setVisible(false);

		if CampaignRegistry.charwizard.spelllist then
			CampaignRegistry.charwizard.spelllist = {};
		end

		updateClasses(wndSummary);
		createFeatureWindows(nodeSource, sGroup, 1, 1, sSelectionRecord);
		updateSummary(wndSummary, 1, 1, sSelectionClass, sSelectionRecord);
		checkExpertise();

	elseif sSelectionGroup == "SELECT MULTICLASS" then
		local bAddWindow = true;
		for _,vAddWindow in pairs(getWindows()) do
			if vAddWindow.group.getValue() > nGroup then
				bAddWindow = false;
			end
		end

		for _,vSelectMultiClass in pairs(getWindows()) do
			if not CampaignRegistry.charwizard.import then
				if vSelectMultiClass.group_name.getValue() ~= sSelectionGroup and vSelectMultiClass.group.getValue() == nGroup then
					vSelectMultiClass.close();
				end
			end
		end

		for _,vSelectMC in pairs(getWindows()) do		
			if vSelectMC.group_name.getValue() == sSelectionGroup and vSelectMC.group.getValue() == nGroup then
				vSelectMC.selection_name.setValue(sSelectionName);
				vSelectMC.selection_shortcut.setValue(sSelectionClass, sSelectionRecord);
				vSelectMC.selection_name.setVisible(true);
				vSelectMC.selection_shortcut.setVisible(true);
				vSelectMC.level_label.setVisible(true);
				vSelectMC.level.setValue(1);
				vSelectMC.level.setVisible(true);
				if CampaignRegistry.charwizard.import then
					vSelectMC.level.addItems(CharWizardManager.getLevelRange(vSelectMC, 1, 1));
				else
					vSelectMC.level.addItems(getLevelRange(vSelectMC, 1));
				end
				updateClasses(wndSummary);
				createFeatureWindows(nodeSource, sGroup, 1, 1, sSelectionRecord);
				updateSummary(wndSummary, sGroup, 1, sSelectionClass, sSelectionRecord);				
				if bAddWindow then
					nGroup = nGroup + 1;
					local wndMultiClass = createWindow();
					createClassList(nGroup, wndMultiClass);
					wndMultiClass.group_name.setValue("SELECT MULTICLASS");
					wndMultiClass.group.setValue(nGroup);
				else
					for _,vCloseOldFeatures in pairs(getWindows()) do
						if (vCloseOldFeatures.group_name.getValue() ~= "SELECT MULTICLASS" or vCloseOldFeatures.group_name.getValue() ~= "INCREASE LEVEL") and vCloseOldFeatures.group.getValue() == nGroup and vCloseOldFeatures.order.getValue() > 0 then
							vCloseOldFeatures.close();
						end
					end
					createFeatureWindows(nodeSource, sGroup, 1, 1, sSelectionRecord);
					updateSummary(wndSummary, sGroup, 1, sSelectionClass, sSelectionRecord);
				end
			end
		end
		checkExpertise();
	elseif sSelectionGroup == "SELECT SKILL PROFICIENCY" then
		local aSkills = {};
		for _,vSelectSkillProf in pairs(getWindows()) do
			if vSelectSkillProf.group_name.getValue() == sSelectionGroup then
				for _,vSkill in pairs(vSelectSkillProf.selection_window.getWindows()) do
					if vSkill.value.getValue() == "1" then
						table.insert(aSkills, vSkill.name.getValue());
					end
				end
				local aFinalSkills = {};
				local aDupes = {};
				for _,v in ipairs(aSkills) do
					if not aDupes[v] then
						table.insert(aFinalSkills, v);
						aDupes[v] = true;
					end
				end
				wndSummary.closeSubType("skills", "class");
				for i=1,#aSkills do
					if aSkills[i] and aSkills[i] ~= "" then
						local wndSkillList = wndSummary.summary.subwindow.summary_skills.createWindow();
						wndSkillList.name.setValue(StringManager.capitalizeAll(string.lower(aSkills[i])));
						wndSkillList.type.setValue("class");
					end
				end
				wndSummary.getSkillDuplicates("class");
				wndSummary.summary.subwindow.summary_skills.applySort();
				if vSelectSkillProf.selection_count.getValue() == 0 then
					vSelectSkillProf.selection_window.setVisible(false);
				end					
			end
		end
	elseif sSelectionGroup == "SELECT SPECIALIZATION" then
		local sClassName = "";
		local sClassRef = "";
		local sClassRecord = "";
		local sClassLevel = "";		
		for _,vSelectSpecialization in pairs(getWindows()) do
			if vSelectSpecialization.group_name.getValue() == "SELECT CLASS" or (vSelectSpecialization.group_name.getValue() == "SELECT MULTICLASS" and vSelectSpecialization.group.getValue() == nGroup) or (vSelectSpecialization.group_name.getValue() == "INCREASE LEVEL" and vSelectSpecialization.group.getValue() == nGroup) then
				sClassName = vSelectSpecialization.selection_name.getValue();
				sClassRef, sClassRecord = vSelectSpecialization.selection_shortcut.getValue();
				sClassLevel = vSelectSpecialization.level.getValue();
			end
			if vSelectSpecialization.group_name.getValue() == sSelectionGroup and vSelectSpecialization.group.getValue() == nGroup then
				vSelectSpecialization.selection_name.setValue(sSelectionName);
				vSelectSpecialization.selection_name.setVisible(true);
				for _,vSpecWindow in pairs(wndSummary.summary.subwindow.summary_specialization.getWindows()) do 
					if vSpecWindow.classgroup.getValue() == tonumber(sGroup) then
						vSpecWindow.close();
					end
				end
				local wndSpecialization = wndSummary.summary.subwindow.summary_specialization.createWindow();
				wndSpecialization.classname.setValue(string.upper(sSelectionName));
				wndSpecialization.classgroup.setValue(tonumber(sGroup));
				wndSpecialization.classlevel.setVisible(false);				
				wndSpecialization.classlevel.setValue(sClassName);
				wndSpecialization.classlink.setValue(sClassRecord);
				for _,vCRClass in pairs(CampaignRegistry.charwizard.classes) do
					if vCRClass.name == string.lower(sClassName) then
						vCRClass.spec = string.lower(sSelectionName);						
					end
				end
				vSelectSpecialization.selection_window.setVisible(false);
			end
		end
	elseif sSelectionGroup == "SELECT EXPERTISE" then
		CampaignRegistry.charwizard.expertise = false;
		local aExpertise = {};
		for _,vSelectExpertise in pairs(getWindows()) do
			if vSelectExpertise.group_name.getValue() == sSelectionGroup then
				for _,vExpertise in pairs(vSelectExpertise.selection_window.getWindows()) do
					if vExpertise.value.getValue() == "1" then
						table.insert(aExpertise, vExpertise.name.getValue());
					end
				end
			end
		end
		for _,vClass in pairs(CampaignRegistry.charwizard.classes) do
			if vClass.name == "rogue" then
				vClass.expertise = aExpertise;
			end
		end
	elseif sSelectionGroup == "SELECT TASHA CLASS OPTIONS" then

	end
	wndSummary.setSpellcasterCode();
	getClassAlerts(wndSummary);
	wndSummary.updateGateCheck();
end

function checkExpertise()
	local bExpertise = false;
	for _,vClassWindow in pairs(getWindows()) do
		if vClassWindow.group_name.getValue() == "SELECT CLASS" or vClassWindow.group_name.getValue() == "SELECT MULTICLASS" then
			if vClassWindow.selection_name.getValue() == "ROGUE" then
				bExpertise = true;
			end
		end
	end
	if bExpertise then
		CampaignRegistry.charwizard.expertise = true;
	end
end

function updateClasses(wndSummary)
	wndSummary.summary.subwindow.summary_class.closeAll();
	CampaignRegistry.charwizard = CampaignRegistry.charwizard or {};
	CampaignRegistry.charwizard.classes = {};
	local aClasses = {};
	local sSpec = "";
	local bMain = false;
	
	for k,v in pairs(getWindows()) do	
		if v.group_name.getValue() == "SELECT CLASS" or v.group_name.getValue() == "SELECT MULTICLASS" or v.group_name.getValue() == "INCREASE LEVEL" then
			if v.selection_name.getValue() ~= "" then
				local sClassName = v.selection_name.getValue();
				local sClass, sRecord = v.selection_shortcut.getValue();
				local nClassGroup = v.group.getValue();
				local nClassLevel = v.level.getValue();
				local wndAddClass = wndSummary.summary.subwindow.summary_class.createWindow();
				wndAddClass.classname.setValue(string.upper(sClassName));
				wndAddClass.classlevel.setValue(nClassLevel);
				wndAddClass.classgroup.setValue(nGroup);
				wndAddClass.classlink.setValue(sRecord);
				if v.group_name.getValue() == "SELECT CLASS" then
					bMain = true;
				else
					bMain = false;
				end

				for _,vSpec in pairs(getWindows()) do
					if vSpec.group_name.getValue() == "SELECT SPECIALIZATION" and vSpec.group.getValue() == nClassGroup then
						if vSpec.selection_name and vSpec.selection_name.getValue() ~= "" then
							sSpec = string.lower(vSpec.selection_name.getValue());
						end
					end
				end

				table.insert(aClasses, {name = string.lower(sClassName), class = sClass, spec = sSpec, record = sRecord, level = nClassLevel, main = bMain});
			end
		end
	end
	CampaignRegistry.charwizard.classes = aClasses;
	wndSummary.setSpellcasterCode();	
end

function updateASI(wndSummary, aASIList)
	if wndSummary.genstats.subwindow then
		wndSummary.genstats.subwindow.contents.subwindow.abilityscore_improvements.closeAll();
	end
	local aClassNames = {};
	for _,vASI in pairs(aASIList) do
		if wndSummary.genstats.subwindow then
			local wndASI = wndSummary.genstats.subwindow.contents.subwindow.abilityscore_improvements.createWindow();
			wndASI.abilityimp_lvl.setValue(vASI.level);
			wndASI.class.setValue(vASI.name);
		end
		if wndSummary.genstats.subwindow then
			for _,v in ipairs(aASIList) do
				if not StringManager.contains(aClassNames, vASI.name) then
					local wndASILabel = wndSummary.genstats.subwindow.contents.subwindow.abilityscore_improvements.createWindowWithClass("asi_label", "");
					wndASILabel.abilityimp_lvl.setValue(0);
					wndASILabel.class.setValue(vASI.name);
					wndASILabel.asi_classname.setValue(vASI.name);
					table.insert(aClassNames, vASI.name);
				end
			end
		end
	end
	if wndSummary.genstats.subwindow then
		wndSummary.genstats.subwindow.contents.subwindow.abilityscore_improvements.applySort();
	end
end

function updateFeats()
	local aFeatList = {};
	if CampaignRegistry.charwizard.feats and CampaignRegistry.charwizard.feats.class then
		aFeatList = CampaignRegistry.charwizard.feats.class;
	end
	for k,v in pairs(getWindows()) do	
		if v.group_name.getValue() == "SELECT CLASS" or v.group_name.getValue() == "SELECT MULTICLASS" or v.group_name.getValue() == "INCREASE LEVEL" then
			if v.selection_name.getValue() ~= "" then
				local sClassName = v.selection_name.getValue();
				local sClass, sRecord = v.selection_shortcut.getValue();
				local nClassGroup = v.group.getValue();
				local nClassLevel = tonumber(v.level.getValue());
				local nMaxFeatLevel = 0;
				if #aFeatList > 0 then
					for _,vFeats in pairs(aFeatList) do
						if vFeats.name == sClassName then
							if vFeats.level > nMaxFeatLevel then
								nMaxFeatLevel = vFeats.level;
							end
						end
					end
				end
				for _,v in pairs(DB.getChildren(DB.findNode(sRecord), "features")) do
					local sFeatureType = CampaignDataManager2.sanitize(DB.getValue(v, "name", ""));
					local nFeatureLevel = tonumber(DB.getValue(v, "level", ""));
					if sFeatureType == "abilityscoreimprovement" and nFeatureLevel <= nClassLevel and nFeatureLevel > nMaxFeatLevel then
						table.insert(aFeatList, {name = sClassName, level = nFeatureLevel});
					end
				end				
			end
		end
	end
	CampaignRegistry.charwizard.feats = CampaignRegistry.charwizard.feats or {};
	CampaignRegistry.charwizard.feats.class = {};
	CampaignRegistry.charwizard.feats.class = aFeatList;
	return aFeatList;
end

function updateSkills(wndSummary, sRecord, sRaceRecord)
	local sText = DB.getValue(sRecord, "text")
	local sChoice = sText:match("choice");
	local sSkillText = sText:match("You have proficiency in the ([^.]+)");
	if not sSkillText then
		sSkillText = sText:match("You gain proficiency in the ([^.]+)");
	end
	local aSkills = {};
	
	if sSkillText then
		sSkillText = sSkillText:gsub(" skill", "");
		sSkillText = sSkillText:gsub("and ", ",");
		table.insert(aSkills, sSkillText);
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
		wndSkillList.type.setValue("class");
		wndSummary.summary.subwindow.summary_skills.applySort();
	end
	wndSummary.getSkillDuplicates();
end

function setMulticlassLevel(sClass, sLevel, nGroup, sClassClass, sClassRecord)
	--[[
	if CampaignRegistry.charwizard.feats then
		CampaignRegistry.charwizard.feats.class = {};
	end
	--]]
	local wndSummary = Interface.findWindow("charwizard", "");	
	local wndClassList = wndSummary.summary.subwindow.summary_class.getWindows();
	local nClassListCount = wndSummary.summary.subwindow.summary_class.getWindowCount();
	local nodeSource = DB.findNode(sClassRecord);
	local sPrevClassLevel = "";
	local bFeat = false;
	if nClassListCount > 0 then
		for _,vClassList in pairs(wndClassList) do
			if string.upper(vClassList.classname.getValue()) == string.upper(sClass) then
				sPrevClassLevel = vClassList.classlevel.getValue();
				vClassList.classlevel.setValue(sLevel);
				for _,vCRClass in pairs(CampaignRegistry.charwizard.classes) do
					if vCRClass.name == string.lower(sClass) then
						local nLevel = tonumber(sLevel);
						local nPrevClassLevel = tonumber(sPrevClassLevel);
						if nLevel > 3 then
							bFeat = true;
						end
						vCRClass.level = nLevel;
						createFeatureWindows(nodeSource, nGroup, nLevel, nPrevClassLevel, sClassRecord);
					end
				end
			end
		end
	end
	if bFeat then
		wndSummary.feat_alert.setVisible(true);
	else
		wndSummary.feat_alert.setVisible(false);		
		--[[
		if CampaignRegistry.charwizard.feats and CampaignRegistry.charwizard.feats.class then
			CampaignRegistry.charwizard.feats.class = {};
			wndSummary.calcSummaryStats();
		end
		--]]
	end
end

function setIncreasedLevel(sClass, sLevel, nGroup, sClassClass, sClassRecord)
	local wndSummary = Interface.findWindow("charwizard", "");	
	local wndClassList = wndSummary.summary.subwindow.summary_class.getWindows();
	local nClassListCount = #CampaignRegistry.charwizard.classes;
	local nodeSource = DB.findNode(sClassRecord);
	local nCurrentLevel = 0;
	local nLevel = tonumber(sLevel);
	local bFeat = false;

	for _,vClass in pairs(CampaignRegistry.charwizard.classes) do
		if vClass.name == string.lower(sClass) then
			nCurrentLevel = vClass.level;
		end
	end

	if nLevel - nCurrentLevel > 3 then
			bFeat = true;
	end

	updateClasses(wndSummary);
	createFeatureWindows(nodeSource, nGroup, nLevel, nCurrentLevel, sClassRecord);
	updateSummary(wndSummary, nGroup, nLevel, sClassClass, sClassRecord);

	if bFeat then
		wndSummary.feat_alert.setVisible(true);
	else
		wndSummary.feat_alert.setVisible(false);		
	end
	wndSummary.commit.setEnabled(true);
	wndSummary.commit.setFrame("buttonup", 5,5,5,5);
end

function updateSummary(wndSummary, sGroup, nLevel, sSelectionClass, sSelectionRecord)
	local nodeSource = DB.findNode(sSelectionRecord);

	if not nodeSource then
		return;
	end
	wndSummary.updateProficiencies();
end

function getClassSpecializationOptions(nodeSource)
	local aOptions = {};
	for _,v in pairs(DB.getChildrenGlobal(nodeSource, "abilities")) do
		table.insert(aOptions, { text = DB.getValue(v, "name", ""), linkclass = "reference_classability", linkrecord = v.getPath() });
	end
	local aFinalSpecs = {};
	local aDupes = {};
	for _,v in ipairs(aOptions) do
		if string.match(v.linkrecord, "DD PHB") then 
			if not aDupes[v.text] then
				table.insert(aFinalSpecs, v);
				aDupes[v.text] = true;
			end
		elseif string.match(string.lower(v.linkrecord), "player") then
			if not aDupes[v.text] then
				table.insert(aFinalSpecs, v);
				aDupes[v.text] = true;
			end		
		else
			if not aDupes[v.text] then
				table.insert(aFinalSpecs, v);
				aDupes[v.text] = true;
			end
		end
	end
	return aFinalSpecs;
end

function getClassAlerts(wndSummary)
	local wndSummary = Interface.findWindow("charwizard", "");	
	local aAlerts = {};
	for _,vClassAlert in pairs(getWindows()) do
		if vClassAlert.group_name.getValue() ~= "SELECT MULTICLASS" and vClassAlert.group_name.getValue() ~= "SELECT TASHA CLASS OPTIONS" then
			if vClassAlert.selection_name.getValue() == "" then
				table.insert(aAlerts, vClassAlert.group_name.getValue());
			end
			if vClassAlert.selection_name.getValue() == "CHOICES:" then
				if vClassAlert.selection_count.getValue() ~= 0 then
					table.insert(aAlerts, vClassAlert.group_name.getValue());
				end
			end
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
	wndSummary.updateAlerts(aFinalAlerts, "class");
end

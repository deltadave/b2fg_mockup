-- 
-- Please see the license.html file included with this distribution for 
-- attribution and copyright information.
--

function onInit()
	createBackgroundLabels();

end

function createBackgroundLabels()
	local w = createWindow();
	w.group_name.setValue("SELECT BACKGROUND");
	w.group.setValue(1);
	createBackgroundList(1, w);
	local wndSummary = Interface.findWindow("charwizard", "");	
	getBackgroundAlerts(wndSummary);
end	
	
function createBackgroundList(nGroup, w)
	aSelectedBackgrounds = {};
	if nGroup > 1 then
		for _,vGroup in pairs(getWindows()) do
			if vGroup.group_name.getValue() == "SELECT BACKGROUND" then
				if vGroup.selection_name.getValue() ~= "" then
					table.insert(aSelectedBackgrounds, string.lower(vGroup.selection_name.getValue()));
				end
			end
		end
	end

	local aBackgroundCheck = {};	
	local aMappings = LibraryData.getMappings("background");
	for _,vMapping in ipairs(aMappings) do
		-- If it is a PHB background, load it first
		for _,vPHBBackground in pairs(DB.getChildrenGlobal(vMapping)) do	
			local sPHBBackgroundLower = StringManager.trim(DB.getValue(vPHBBackground, "name", "")):lower();
			local sPHBBackgroundLink = vPHBBackground.getPath();
			if string.match(sPHBBackgroundLink, "DD PHB Deluxe") then
				table.insert(aBackgroundCheck, sPHBBackgroundLower);
				if not StringManager.contains(aSelectedBackgrounds, sPHBBackgroundLower) then
					local wndSubwindow = w.selection_window.createWindow();
					wndSubwindow.name.setValue(sPHBBackgroundLower);
					local sPHBBackgroundCapitalized = StringManager.capitalizeAll(sPHBBackgroundLower);
					wndSubwindow.bname.setText(sPHBBackgroundCapitalized);
					wndSubwindow.group.setValue(nGroup);
					wndSubwindow.shortcut.setValue("reference_background", sPHBBackgroundLink);
				end
			end
		end
		-- Load all other backgrounds ignoring their version of base backgrounds.
		for _,vBackground in pairs(DB.getChildrenGlobal(vMapping)) do	
			local sBackgroundLower = StringManager.trim(DB.getValue(vBackground, "name", "")):lower();
			local sBackgroundLink = vBackground.getPath();
			if not StringManager.contains(aBackgroundCheck, sBackgroundLower) then
				table.insert(aBackgroundCheck, sBackgroundLower);
				local wndSubwindow = w.selection_window.createWindow();
				wndSubwindow.name.setValue(sBackgroundLower);
				local sBackgroundCapitalized = StringManager.capitalizeAll(sBackgroundLower);
				wndSubwindow.bname.setText(sBackgroundCapitalized);
				wndSubwindow.group.setValue(nGroup);				
				wndSubwindow.shortcut.setValue("reference_background", sBackgroundLink);
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

function createTools(sTrait, w)
	local sText = DB.getText(sTrait, "text");
	local sTools = sText:match("choice: ([^.]+)");
	
	if not sTools then
		return false;
	end
	if sTools then
		sTools = sTools:gsub(" or ", ",");
		sTools = sTools:gsub(",%s", ",");
		sTools = sTools:gsub(",,", ",");

		for vTool in string.gmatch(sTools, "([^,]+)") do 
			local wndTools = w.selection_window.createWindow();
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

function createLanguages(sTrait, w)
	local sText = DB.getText(sTrait, "text");
	local sLanguages = sText:match("You can speak, read, and write ([^.]+)");
	if not sLanguages then
		sLanguages = sText:match("You can read and write ([^.]+)");
	end
	
	if not sLanguages then
		return false;
	end
	if sLanguages then		
		sLanguages = sLanguages:gsub("and ", ",");
		sLanguages = sLanguages:gsub("one extra language of your choice", "Choice");
		sLanguages = sLanguages:gsub("one other language of your choice", "Choice");
		sLanguages = sLanguages:gsub(", but you.*$", "");

		for vLanguage in string.gmatch(sLanguages, "([^,]+)") do 
			local wndLanguages = w.selection_window.createWindow();
			wndLanguages.bname.setText(StringManager.capitalize(vLanguage));
			wndLanguages.name.setValue(StringManager.capitalize(vLanguage));
		end
	else
		if sText then
			print("ERROR - Unhandled Language Selection Text for: " .. sText);
		else
			print("ERROR - Unhandled Language Selection Text.");
		end
	end	
end

function createBackgroundWindows(wndSummary, sType, aSelections, nSkillChoices)
	local w = createWindow();
	w.group_name.setValue(sType);
	w.group.setValue(2);
	w.selection_shortcut.setVisible(false);
	w.selection_name.setValue("CHOICES:");
	w.selection_name.setVisible(true);
	w.selection_count.setValue(nSkillChoices);
	w.selection_count.setVisible(true);

	if sType == "SELECT SKILL PROFICIENCY" then
		w.order.setValue(1);
	elseif sType == "SELECT LANGUAGES" then
		w.order.setValue(2);
	elseif sType == "SELECT LANGUAGES" then
		w.order.setValue(3);
	else
		w.order.setValue(9);
	end

	for i=1,#aSelections do
		local wndSubwindow = w.selection_window.createWindow();
		wndSubwindow.name.setValue(aSelections[i]);
		local sSelectionsCapitalized = StringManager.capitalizeAll(aSelections[i]);
		wndSubwindow.bname.setText(sSelectionsCapitalized);
		wndSubwindow.group.setValue(2);
		--wndSubwindow.shortcut.setValue("reference_background", sPHBBackgroundLink);		
	end

	applySort();
end

function parseSelection(sGroup, sSelectionGroup, sValue, sSelectionName, sSelectionClass, sSelectionRecord)
	local aBackgroundSkills = {};
	local nGroup = tonumber(sGroup);
	local wndSummary = Interface.findWindow("charwizard", "");	
	local sBackgroundText = DB.getValue(DB.findNode(sSelectionRecord), "text");
	
	if sSelectionGroup == "SELECT BACKGROUND" then
		for _,vSelectBackground in pairs(getWindows()) do
			if vSelectBackground.group_name.getValue() == "SELECT BACKGROUND" then
				vSelectBackground.selection_name.setValue(sSelectionName);
				vSelectBackground.selection_shortcut.setValue(sSelectionClass, sSelectionRecord);
				vSelectBackground.selection_name.setVisible(true);
				vSelectBackground.selection_shortcut.setVisible(true);
				CampaignRegistry.charwizard = CampaignRegistry.charwizard or {};
				CampaignRegistry.charwizard.background = CampaignRegistry.charwizard.background or {};
				
				CampaignRegistry.charwizard.background.name = string.lower(sSelectionName);
				CampaignRegistry.charwizard.background.class = sSelectionClass;				
				CampaignRegistry.charwizard.background.record = sSelectionRecord;
				vSelectBackground.selection_window.setVisible(false);
			else
				vSelectBackground.close();
			end
			wndSummary.summary.subwindow.summary_background.setValue(sSelectionName);
			wndSummary.closeSubType("all", "background");
		end
		if string.match(sBackgroundText, "Skill:") or  string.match(sBackgroundText, "Skill Proficiencies:") then
			local aBackgroundSkills, bChoice, aChoiceSkills, nSkillChoices = updateSkills(wndSummary, sBackgroundText);
			if bChoice then
				createBackgroundWindows(wndSummary, "SELECT SKILL PROFICIENCY", aChoiceSkills, nSkillChoices);			
			end
			wndSummary.summary.subwindow.summary_skills.applySort();
		end
		if string.match(sBackgroundText, "Language") then
			local aBackgroundLanguages, bChoice, aChoiceLanguages, nLanguageChoices = updateLanguages(wndSummary, sBackgroundText);
			if bChoice then
				createBackgroundWindows(wndSummary, "SELECT LANGUAGES", aChoiceLanguages, nLanguageChoices);
			end
			wndSummary.summary.subwindow.summary_languages.applySort();
		end
		if string.match(sBackgroundText, "Tool") then
			local aBackgroundTools, bChoice, aItemTools, nToolChoices = updateTools(wndSummary, sBackgroundText);
			if bChoice then
				createBackgroundWindows(wndSummary, "SELECT TOOL PROFICIENCY", aItemTools, nToolChoices);
			end
			wndSummary.summary.subwindow.summary_proficiencies.applySort();
		end
		if string.match(sBackgroundText, "Guild Spells") then
			local aBackgroundSpells, bChoice, aSpells, nSpellChoices = updateSpells(wndSummary, sBackgroundText, sSelectionClass, sSelectionRecord);
			if bChoice then
				createBackgroundWindows(wndSummary, "SELECT TOOL PROFICIENCY", aItemTools, nToolChoices);
			end
			wndSummary.summary.subwindow.summary_proficiencies.applySort();
		end		
		
	elseif sSelectionGroup == "SELECT SKILL PROFICIENCY" then
		local aSkills = {};
		local sSkillClass = "";
		local sSkillRecord = "";
		local sSkillText = "";		
		for _,vSelectSkillProf in pairs(getWindows()) do
			if vSelectSkillProf.group_name.getValue() == "SELECT BACKGROUND" then
				sSkillClass, sSkillRecord = vSelectSkillProf.selection_shortcut.getValue();
				sSkillText = DB.getValue(DB.findNode(sSkillRecord), "text");
			end
			if vSelectSkillProf.group_name.getValue() == sSelectionGroup then
				for _,vSkill in pairs(vSelectSkillProf.selection_window.getWindows()) do
					if vSkill.value.getValue() == "1" then
						table.insert(aSkills, vSkill.name.getValue());
					end
				end
				updateSkills(wndSummary, sSkillText, aSkills);
				wndSummary.summary.subwindow.summary_skills.applySort();
				if vSelectSkillProf.selection_count.getValue() == 0 then
					vSelectSkillProf.selection_window.setVisible(false);
				end				
			end
		end
	elseif sSelectionGroup == "SELECT LANGUAGES" then
		local aLanguages = {};
		local sLangClass = "";
		local sLangRecord = "";
		local sLanguageText = "";		
		for _,vSelectLangProf in pairs(getWindows()) do
			if vSelectLangProf.group_name.getValue() == "SELECT BACKGROUND" then
				sLangClass, sLangRecord = vSelectLangProf.selection_shortcut.getValue();
				sLanguageText = DB.getValue(DB.findNode(sLangRecord), "text");
			end
			if vSelectLangProf.group_name.getValue() == sSelectionGroup then
				for _,vLanguage in pairs(vSelectLangProf.selection_window.getWindows()) do
					if vLanguage.value.getValue() == "1" then
						table.insert(aLanguages, vLanguage.name.getValue());
					end
				end
				updateLanguages(wndSummary, sLanguageText, aLanguages);
				wndSummary.summary.subwindow.summary_languages.applySort();
				if vSelectLangProf.selection_count.getValue() == 0 then
					vSelectLangProf.selection_window.setVisible(false);
				end
			end
		end	
	elseif sSelectionGroup == "SELECT TOOL PROFICIENCY" then
		local aTools = {};
		local sToolClass = "";
		local sToolRecord = "";
		local sToolText = "";		
		for _,vSelectToolProf in pairs(getWindows()) do
			if vSelectToolProf.group_name.getValue() == "SELECT BACKGROUND" then
				sToolClass, sToolRecord = vSelectToolProf.selection_shortcut.getValue();
				sToolText = DB.getValue(DB.findNode(sToolRecord), "text");
			end
			if vSelectToolProf.group_name.getValue() == sSelectionGroup then
				for _,vTool in pairs(vSelectToolProf.selection_window.getWindows()) do
					if vTool.value.getValue() == "1" then
						table.insert(aTools, vTool.name.getValue());
					end
				end
				updateTools(wndSummary, sToolText, aTools);
				wndSummary.summary.subwindow.summary_proficiencies.applySort();
				if vSelectToolProf.selection_count.getValue() == 0 then
					vSelectToolProf.selection_window.setVisible(false);
				end
			end
		end	
	end
	getBackgroundAlerts(wndSummary);
	wndSummary.updateGateCheck();	
end

function updateSpells(wndSummary, sBackgroundText, sSelectionClass, sSelectionRecord)
	local sSpellText = "";
	local sSpellTableText = "";	
	local aSpells = {};
	local aLevelSpells = {};
	CampaignRegistry.charwizard.background = CampaignRegistry.charwizard.background or {};	
	CampaignRegistry.charwizard.background.spells = CampaignRegistry.charwizard.background.spells or {};	
	for _,vBackgroundFeatures in pairs(DB.getChildren(DB.findNode(sSelectionRecord), "features")) do
		if string.match(DB.getValue(vBackgroundFeatures, "name", ""), "Guild Spells") then
			sSpellText = DB.getValue(vBackgroundFeatures, "text");
			CampaignRegistry.charwizard.background.spells.name = DB.getValue(vBackgroundFeatures, "name", "");
		end
	end
	
	sSpellTableText = string.match(sSpellText, "Cantrip(.+)1st");
	sSpellTableText = string.gsub(sSpellTableText, "</td>", "");
	sSpellTableText = string.gsub(sSpellTableText, '<td colspan="3">', "");
	sSpellTableText = string.gsub(sSpellTableText, "<td>", "");
	sSpellTableText = string.gsub(sSpellTableText, "<tr>", "");
	sSpellTableText = string.gsub(sSpellTableText, "</tr>", "");
	if not UtilityManager.isClientFGU() then
		sSpellTableText = string.match(sSpellTableText, "\t+([^\t]+)\t+");
	end
	sSpellTableText = string.gsub(sSpellTableText, "\n", "");
	sSpellTableText = string.gsub(sSpellTableText, ", ", ",");
	local _,nCount = string.gsub(sSpellTableText, ",", "");
	for sSpellName in sSpellTableText:gmatch('[^,]+') do
		table.insert(aLevelSpells, sSpellName);
	end
	CampaignRegistry.charwizard.background.spells[0] = aLevelSpells;
	sSpellTableText = string.match(sSpellText, "1st(.+)2nd");
	sSpellTableText = string.gsub(sSpellTableText, "</td>", "");
	sSpellTableText = string.gsub(sSpellTableText, '<td colspan="3">', "");
	sSpellTableText = string.gsub(sSpellTableText, "<td>", "");
	sSpellTableText = string.gsub(sSpellTableText, "<tr>", "");
	sSpellTableText = string.gsub(sSpellTableText, "</tr>", "");
	if not UtilityManager.isClientFGU() then
		sSpellTableText = string.match(sSpellTableText, "\t+([^\t]+)\t+");
	end
	sSpellTableText = string.gsub(sSpellTableText, "\n", "");
	sSpellTableText = string.gsub(sSpellTableText, ", ", ",");		
	local _,nCount = string.gsub(sSpellTableText, ",", "");
	aLevelSpells = {};
	for sSpellName in sSpellTableText:gmatch('[^,]+') do
		table.insert(aLevelSpells, sSpellName);
	end
	CampaignRegistry.charwizard.background.spells[1] = aLevelSpells;
	sSpellTableText = string.match(sSpellText, "2nd(.+)3rd");
	sSpellTableText = string.gsub(sSpellTableText, "</td>", "");
	sSpellTableText = string.gsub(sSpellTableText, '<td colspan="3">', "");
	sSpellTableText = string.gsub(sSpellTableText, "<td>", "");
	sSpellTableText = string.gsub(sSpellTableText, "<tr>", "");
	sSpellTableText = string.gsub(sSpellTableText, "</tr>", "");	
	if not UtilityManager.isClientFGU() then
		sSpellTableText = string.match(sSpellTableText, "\t+([^\t]+)\t+");
	end
	sSpellTableText = string.gsub(sSpellTableText, "\n", "");
	sSpellTableText = string.gsub(sSpellTableText, ", ", ",");		
	local _,nCount = string.gsub(sSpellTableText, ",", "");
	aLevelSpells = {};
	for sSpellName in sSpellTableText:gmatch('[^,]+') do
		table.insert(aLevelSpells, sSpellName);
	end
	CampaignRegistry.charwizard.background.spells[2] = aLevelSpells;
	sSpellTableText = string.match(sSpellText, "3rd(.+)4th");
	sSpellTableText = string.gsub(sSpellTableText, "</td>", "");
	sSpellTableText = string.gsub(sSpellTableText, '<td colspan="3">', "");
	sSpellTableText = string.gsub(sSpellTableText, "<td>", "");
	sSpellTableText = string.gsub(sSpellTableText, "<tr>", "");
	sSpellTableText = string.gsub(sSpellTableText, "</tr>", "");	
	if not UtilityManager.isClientFGU() then
		sSpellTableText = string.match(sSpellTableText, "\t+([^\t]+)\t+");
	end
	sSpellTableText = string.gsub(sSpellTableText, "\n", "");
	sSpellTableText = string.gsub(sSpellTableText, ", ", ",");		
	local _,nCount = string.gsub(sSpellTableText, ",", "");
	aLevelSpells = {};
	for sSpellName in sSpellTableText:gmatch('[^,]+') do
		table.insert(aLevelSpells, sSpellName);
	end
	CampaignRegistry.charwizard.background.spells[3] = aLevelSpells;
	sSpellTableText = string.match(sSpellText, "4th(.+)5th");
	sSpellTableText = string.gsub(sSpellTableText, "</td>", "");
	sSpellTableText = string.gsub(sSpellTableText, '<td colspan="3">', "");
	sSpellTableText = string.gsub(sSpellTableText, "<td>", "");
	sSpellTableText = string.gsub(sSpellTableText, "<tr>", "");
	sSpellTableText = string.gsub(sSpellTableText, "</tr>", "");	
	if not UtilityManager.isClientFGU() then
		sSpellTableText = string.match(sSpellTableText, "\t+([^\t]+)\t+");
	end
	sSpellTableText = string.gsub(sSpellTableText, "\n", "");	
	sSpellTableText = string.gsub(sSpellTableText, ", ", ",");	
	local _,nCount = string.gsub(sSpellTableText, ",", "");
	aLevelSpells = {};
	for sSpellName in sSpellTableText:gmatch('[^,]+') do
		table.insert(aLevelSpells, sSpellName);
	end
	CampaignRegistry.charwizard.background.spells[4] = aLevelSpells;
	sSpellTableText = string.match(sSpellText, "5th(.+)</table>");
	sSpellTableText = string.gsub(sSpellTableText, "</td>", "");
	sSpellTableText = string.gsub(sSpellTableText, '<td colspan="3">', "");
	sSpellTableText = string.gsub(sSpellTableText, "<td>", "");
	sSpellTableText = string.gsub(sSpellTableText, "<tr>", "");
	sSpellTableText = string.gsub(sSpellTableText, "</tr>", "");	
	if not UtilityManager.isClientFGU() then
		sSpellTableText = string.match(sSpellTableText, "\t+([^\t]+)\t+");
	end
	sSpellTableText = string.gsub(sSpellTableText, "\n", "");
	sSpellTableText = string.gsub(sSpellTableText, ", ", ",");	
	local _,nCount = string.gsub(sSpellTableText, ",", "");
	aLevelSpells = {};
	for sSpellName in sSpellTableText:gmatch('[^,]+') do
		table.insert(aLevelSpells, sSpellName);
	end
	CampaignRegistry.charwizard.background.spells[5] = aLevelSpells;
end

function updateDuplicates(wndSummary)
	local _, aDuplicateSkills = wndSummary.getSkillDuplicates("background");
	local aChoiceSkills = {};
	local aSkillList = {};	
	local nSkillChoices = 0;
	local nDupedSkills = 0;
	if aDuplicateSkills and #aDuplicateSkills > 0 then
		nDupedSkills = #aDuplicateSkills;
	end
	for _,vDupeSkill in pairs(aDuplicateSkills) do
		for _,vSkillList in pairs(wndSummary.summary.subwindow.summary_skills.getWindows()) do
			table.insert(aSkillList, vSkillList.name.getValue());
			if vDupeSkill == vSkillList.name.getValue() and vSkillList.type.getValue() == "background" then
				vSkillList.close();
				bFreeSkill = true;
			end
		end
	end
	nSkillChoices = nDupedSkills;

	for kSkill,_ in pairs(DataCommon.skilldata) do 
		if not StringManager.contains(aSkillList, kSkill) then
			table.insert(aChoiceSkills, kSkill);			
		end
	end
	return aChoiceSkills, nSkillChoices;
end	

function updateSkills(wndSummary, sSkillText, aIncomingSkills)
	wndSummary.closeSubType("skills", "background");
	local aSkills = {};
	local aBackgroundSkills = {};
	local aChoiceSkills = {};
	local nSkillChoices = 1;
	local bChoice = false;
	local bFreeSkill = false;
	
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

	if not sSkills then
		return false;
	end

	if string.match(string.lower(sSkills), "two") then
		nSkillChoices = 2;
	end
	
	if string.match(sSkills, "choice") or string.match(sSkills, "from among ") then
		bChoice = true;
		if string.match(sSkills, "Intelligence, Wisdom, or Charisma skill (.+)") then
			for _,v in pairs(DataCommon.skilldata) do
				if v.stat == "intelligence" or v.stat == "wisdom" or v.stat == "charisma" then
					table.insert(aChoiceSkills, v.lookup);
				end
			end
		else
			local sChoiceSkills = string.match(sSkills, "from among (.+)");
			sChoiceSkills = string.gsub(sChoiceSkills, "</b>", "");
			sChoiceSkills = string.gsub(sChoiceSkills, "</p><p><b>", "");
			sChoiceSkills = string.gsub(sChoiceSkills, "and ", "");
			sChoiceSkills = string.gsub(sChoiceSkills, "plus(.+)", "");
			sChoiceSkills = string.gsub(sChoiceSkills, "one(.+)", "");
			for s in string.gmatch(sChoiceSkills, "(%a[%a%s]+)%,?") do
				table.insert(aChoiceSkills, s);
			end
		end
	end
	
	if not string.match(sSkills, "Choose") then
		sSkills = string.gsub(sSkills, "</b>", "");
		sSkills = string.gsub(sSkills, "</p><p><b>", "");
		sSkills = string.gsub(sSkills, "and ", "");
		sSkills = string.gsub(sSkills, "plus(.+)", "");
		sSkills = string.gsub(sSkills, "one(.+)", "");		
		for s in string.gmatch(sSkills, "(%a[%a%s]+)%,?") do
			for _,vSkillDupe in pairs(wndSummary.summary.subwindow.summary_skills.getWindows()) do
				if s == vSkillDupe.name.getValue() then
					bFreeSkill = true;
				else
					table.insert(aBackgroundSkills, s);					
				end
			end
		end
	end
	if string.match(sSkills, "Choose") then
		bChoice = true;	
		local sChoiceSkills = string.match(sSkills, "from among (.+)");
		sChoiceSkills = string.gsub(sChoiceSkills, "</b>", "");
		sChoiceSkills = string.gsub(sChoiceSkills, "</p><p><b>", "");
		sChoiceSkills = string.gsub(sChoiceSkills, "and ", "");
		sChoiceSkills = string.gsub(sChoiceSkills, "plus(.+)", "");
		sChoiceSkills = string.gsub(sChoiceSkills, "one(.+)", "");		
		for s in string.gmatch(sChoiceSkills, "(%a[%a%s]+)%,?") do
			table.insert(aChoiceSkills, s);
		end			
	end

	if aBackgroundSkills then
		for i=1,#aBackgroundSkills do
			table.insert(aSkills, aBackgroundSkills[i]);
		end
	end

	for _,vSelectSkillProf in pairs(getWindows()) do
		if vSelectSkillProf.group_name.getValue() == "SELECT SKILL PROFICIENCY" then
			for _,vSkill in pairs(vSelectSkillProf.selection_window.getWindows()) do
				if vSkill.value.getValue() == "1" then
					table.insert(aSkills, vSkill.name.getValue());
				end
			end
		end
	end
	if aIncomingSkills then
		for i=1,#aIncomingSkills do
			table.insert(aSkills, aIncomingSkills[i]);
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

	for i=1,#aFinalSkills do
		local wndSkillList = wndSummary.summary.subwindow.summary_skills.createWindow();
		wndSkillList.name.setValue(StringManager.capitalize(aFinalSkills[i]));
		wndSkillList.type.setValue("background");
		wndSummary.summary.subwindow.summary_skills.applySort();
	end
	if bFreeSkill then
		aChoiceSkills, nSkillChoices = updateDuplicates(wndSummary);
		return aBackgroundSkills, true, aChoiceSkills, nSkillChoices;
	else
		wndSummary.getSkillDuplicates("background");	
		return aBackgroundSkills, bChoice, aChoiceSkills, nSkillChoices;
	end
end

function updateLanguages(wndSummary, sLanguageText, aIncomingLanguages)
	wndSummary.closeSubType("languages", "background");
	local aLanguages = {};
	local aBackgroundLanguages = {};
	local aChoiceLanguages = {};
	local nLanguageChoices = 1;
	local bChoice = true;
	local sLanguages = string.match(sLanguageText, "Language(.+)Equipment:");
	
	if string.match(string.lower(sLanguages), "two") then
		nLanguageChoices = 2;
	end
	
	local aAvailableLanguages = wndSummary.getAvailableLanguages()
	
	if string.match(sLanguages, "if you already speak Dwarvish") then
		if StringManager.contains(aAvailableLanguages, "Dwarvish") then
			table.insert(aBackgroundLanguages, "Dwarvish");
			bChoice = false;
		end
	end	

	if string.match(sLanguages, "Choose") then
		local sChoiceLanguages = string.match(sLanguages, "Choose one of (.+)");	
		if not sChoiceLanguages then
			sChoiceLanguages = string.match(sLanguages, "Choose either (.+)");
		end
		if not sChoiceLanguages then
			return false;
		end
		sChoiceLanguages = string.gsub(sChoiceLanguages, "</b>", "");
		sChoiceLanguages = string.gsub(sChoiceLanguages, "</p><p><b>", "");
		sChoiceLanguages = string.gsub(sChoiceLanguages, "and ", "");
		sChoiceLanguages = string.gsub(sChoiceLanguages, "or ", "");		
		sChoiceLanguages = string.gsub(sChoiceLanguages, "plus(.+)", "");
		sChoiceLanguages = string.gsub(sChoiceLanguages, "one(.+)", "");		
		for s in string.gmatch(sChoiceLanguages, "(%a[%a%s]+)%,?") do
			table.insert(aChoiceLanguages, s);
		end		
	end

	if aBackgroundLanguages then
		for i=1,#aBackgroundLanguages do
			table.insert(aLanguages, aBackgroundLanguages[i]);
		end
	end

	for _,vSelectLangProf in pairs(getWindows()) do
		if vSelectLangProf.group_name.getValue() == "SELECT LANGUAGES" then
			for _,vLanguage in pairs(vSelectLangProf.selection_window.getWindows()) do
				if vLanguage.value.getValue() == "1" then
					table.insert(aLanguages, vLanguage.name.getValue());
				end
			end
		end
	end
	if aIncomingLanguages then
		for i=1,#aIncomingLanguages do
			table.insert(aLanguages, aIncomingLanguages[i]);
		end
	end

	local aFinalLanguages = {};
	local aDupes = {};
	for _,v in ipairs(aLanguages) do
		if not aDupes[v] then
			table.insert(aFinalLanguages, v);
			aDupes[v] = true;
		end
	end

	for i=1,#aFinalLanguages do
		local wndLangList = wndSummary.summary.subwindow.summary_languages.createWindow();
		wndLangList.language.setValue(StringManager.capitalize(aFinalLanguages[i]));
		wndLangList.type.setValue("background");
		wndSummary.summary.subwindow.summary_languages.applySort();
	end

	
	if not bChoice then
		return aBackgroundLanguages, bChoice, {}, nLanguageChoices;
	else
		if #aChoiceLanguages > 0 then
			return {}, bChoice, aChoiceLanguages, nLanguageChoices;
		else
			return {}, bChoice, aAvailableLanguages, nLanguageChoices;
		end
	end
end

function updateTools(wndSummary, sToolText, aIncomingTools)
	wndSummary.closeSubType("proficiencies", "background");
	local aTools = {};
	local aToolGroups = {};
	local aItemTools = {};
	local nToolChoices = 1;
	local bChoice = false;
	local sTools = string.match(sToolText, "Tool(.+)Languages:");
	if not sTools then
		sTools = string.match(sToolText, "Tool(.+)Language:");
	end
	if not sTools then	
		sTools = string.match(sToolText, "Tool(.+)Equipment:");
	end
	
	if not sTools then
		return false;
	end
	
	if string.match(string.lower(sTools), "two") then
		nToolChoices = 2;
	end

	if string.match(sTools, "type") or string.match(sTools, "choice") then
		bChoice = true;
		local sChoiceTools = string.match(sTools, "type of (.+)");
		if string.match(sTools, "gaming") then
			table.insert(aToolGroups, "gaming set");
		end
		if string.match(sTools, "musical") then
			table.insert(aToolGroups, "musical instrument");
		end
		if string.match(sTools, "artisan") then
			table.insert(aToolGroups, "artisan's tools");
		end
		for i=1,#aToolGroups do
			local a = wndSummary.getToolType(aToolGroups[i]);
			for j=1,#a do
				table.insert(aItemTools, a[j]);
			end
		end
		if string.match(sTools, "and thieves") then
			table.insert(aItemTools, "thieves tools");
		end
	end
	if not string.match(sTools, "Choose") then
		sTools = string.gsub(sTools, "</b>", "");
		sTools = string.gsub(sTools, "</p><p><b>", "");
		sTools = string.gsub(sTools, "and ", "");
		sTools = string.gsub(sTools, "plus(.+)", "");
		sTools = string.gsub(sTools, "one(.+)", "");		
		for s in string.gmatch(sTools, "(%a[%a%s]+)%,?") do
			if string.match(string.lower(s), "vehicle") then
				s = "";
			end
			if string.match(string.lower(s), "choice") then
				s = "";
			end
			if string.match(string.lower(s), "type") then
				s = "";
			end
			if string.match(string.lower(s), "tool") then
				s = "";
			end
			if string.match(string.lower(s), "any") then
				s = "";
			end			
			if string.lower(s) == "land" then
				s = "Vehicles (Land)";
			end
			if string.lower(s) == "water" then
				s = "Vehicles (Water)";
			end			
			if string.lower(s) == "pois" then
				s = "poisoner's kit";
			end
			if string.lower(s) == "navigator" then
				s = "navigator's tools";
			end			
			if string.lower(s) == "thieves" then
				s = "thieves tools";
			end
			if s ~= "" then
				table.insert(aTools, s);
			end
		end
	end
	
	if aIncomingTools then
		for i=1,#aIncomingTools do
			table.insert(aTools, aIncomingTools[i]);
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

	for i=1,#aFinalTools do
		local wndToolList = wndSummary.summary.subwindow.summary_proficiencies.createWindow();
		wndToolList.name.setValue(StringManager.capitalizeAll(aFinalTools[i]));
		wndToolList.type.setValue("background");
		wndSummary.summary.subwindow.summary_proficiencies.applySort();
	end
	
	return aBackgroundTools, bChoice, aItemTools, nToolChoices;	
end

function getBackgroundAlerts(wndSummary)
	local aAlerts = {};
	for _,vBackgroundAlert in pairs(getWindows()) do
		if vBackgroundAlert.selection_name.getValue() == "" then
			table.insert(aAlerts, vBackgroundAlert.group_name.getValue());
		end
		if vBackgroundAlert.selection_name.getValue() == "CHOICES:" then
			if vBackgroundAlert.selection_count.getValue() > 0 then
				table.insert(aAlerts, vBackgroundAlert.group_name.getValue());
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
	wndSummary.updateAlerts(aFinalAlerts, "background");
end
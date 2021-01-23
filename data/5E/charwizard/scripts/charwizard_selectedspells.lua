-- 
-- Please see the license.html file included with this distribution for 
-- attribution and copyright information.
--

function onInit()
	if CampaignRegistry.charwizard.spelllist then
		updateSpelllist();
	end	
end

function onSpellClosed(nodeItem)
	if level.getValue() == "0" then
		local sCantrips = windowlist.window.cantrips_available.getValue();
		local sTotalCantrips = string.match(sCantrips, "/(%d+)");
		local sCantripsAvailable = string.match(sCantrips, "%d+");
		local nCantripsAvailable = tonumber(sCantripsAvailable) + 1;
		windowlist.window.cantrips_available.setValue(nCantripsAvailable .. "/" .. sTotalCantrips);
	else
		local sSpells = windowlist.window.spells_available.getValue();
		local sTotalSpells = string.match(sSpells, "/(%d+)");
		local sSpellsAvailable = string.match(sSpells, "%d+");
		local nSpellsAvailable = tonumber(sSpellsAvailable) + 1;
		windowlist.window.spells_available.setValue(nSpellsAvailable .. "/" .. sTotalSpells);				
	end
end

function updateSpelllist()
	CampaignRegistry.charwizard.spelllist = {};
	local aSpelllist = CampaignRegistry.charwizard.spelllist or {};
	for _,vSpell in pairs(getWindows()) do
		local sWindowClass, sWindowRecord = vSpell.link.getValue();
		local sSource = string.lower(vSpell.group.getValue());
		table.insert(CampaignRegistry.charwizard.spelllist, {class = sWindowClass, record = sWindowRecord, source = sSource});
	end
	CampaignRegistry.charwizard.spelllist = aSpelllist;
end

function onDrop(x, y, draginfo)
	local sDragClass, sDragRecord = draginfo.getShortcutData();
	local bFound = false;
	CampaignRegistry.charwizard.spelllist = CampaignRegistry.charwizard.spelllist or {};
	for _,wndSpellPath in pairs(getWindows()) do
		sClass, sRecord = wndSpellPath.link.getValue();
		if sRecord == sDragRecord then
			bFound = true;
		end
	end
	if sDragClass == "reference_spell" and not bFound then
		local wndSpellDrop = createWindow();
		wndSpellDrop.link.setValue(draginfo.getShortcutData());
		wndSpellDrop.name.setValue(draginfo.getDescription());
		local nSpellLevel = DB.getValue(DB.findNode(sDragRecord), "level", 0);
		wndSpellDrop.level.setValue(nSpellLevel);
		if nSpellLevel == 0 then
			wndSpellDrop.displaylevel.setValue("Cantrip");
			local sCantrips = window.cantrips_available.getValue();
			local sTotalCantrips = string.match(sCantrips, "/(%d+)");
			local sCantripsAvailable = string.match(sCantrips, "%d+");
			local nCantripsAvailable = tonumber(sCantripsAvailable) - 1;
			window.cantrips_available.setValue(nCantripsAvailable .. "/" .. sTotalCantrips);
		else
			wndSpellDrop.displaylevel.setValue(nSpellLevel);
			local sSpells = window.spells_available.getValue();
			local sTotalSpells = string.match(sSpells, "/(%d+)");
			local sSpellsAvailable = string.match(sSpells, "%d+");
			local nSpellsAvailable = tonumber(sSpellsAvailable) - 1;
			window.spells_available.setValue(nSpellsAvailable .. "/" .. sTotalSpells);
			
		end
		local sClassName = "";
		for _,vSpellClassWindow in pairs(window.spellclass.getWindows()) do
			if vSpellClassWindow.toggle.getValue() == "1" then
				sClassName = vSpellClassWindow.name.getValue();
			end
		end
		wndSpellDrop.group.setValue(sClassName);
	end
	updateSpelllist();
	applySort();
end

function getSelectedSpellCount(sClass)
	local nCantrips = 0;
	local nSpells = 0;
	for _,vSpell in pairs (getWindows()) do
		local nSpellLevel = tonumber(vSpell.level.getValue());
		if sClass and string.lower(vSpell.group.getValue()) == string.lower(sClass) then
			if nSpellLevel == 0 then
				nCantrips = nCantrips + 1;
			else
				nSpells = nSpells + 1;
			end
		end
	end
	return nCantrips, nSpells;
end
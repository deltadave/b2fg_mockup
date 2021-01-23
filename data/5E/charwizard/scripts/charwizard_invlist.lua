-- 
-- Please see the license.html file included with this distribution for 
-- attribution and copyright information.
--

function onInit()
	if CampaignRegistry.charwizard.import then
		--setInventory();
	end
end

function onItemDeleted(nCount, sClass, sRecord)
	local w = Interface.findWindow("charwizard", "");
	if w then
		local aInventoryList = CampaignRegistry.charwizard.inventorylist;
		for k,vItem in pairs(aInventoryList) do
			if vItem.record == sRecord then
				table.remove(aInventoryList, k);
			end
		end
		CampaignRegistry.charwizard.inventorylist = aInventoryList;		
		updateCost();
	end
end

function setInventory()
	for _,vItem in pairs(CampaignRegistry.charwizard.inventory) do
		local sItemName = DB.getValue(vItem, "name", "");
		local wndInventory = createWindow();
		wndInventory.shortcut.setValue("reference_item", sRecord);
		wndInventory.carried.setValue(vItem.carried);
		wndInventory.name.setValue(sItemName);
		wndInventory.count.setValue(vItem.count);		
	end
end

function updateInventory()
	local aInventory = {};
	local sWindowClass = "";
	local sWindowRecord = "";
	for _,vListItem in pairs(getWindows()) do
		local sWindowClass, sWindowRecord = vListItem.shortcut.getValue();
		table.insert(aInventory, {record = sWindowRecord, count = vListItem.count.getValue(), carried = vListItem.carried.getValue()});
	end
	CampaignRegistry.charwizard.inventorylist = aInventory;
	updateCost();	
end

function onDrop(x, y, draginfo)
	if draginfo.isType("shortcut") then
		local sClass, sRecord = draginfo.getShortcutData();
		local nodeSource = draginfo.getDatabaseNode();
		local aInventory = {};
		local nCount = 1;
		local bFound = false;
		local bArmorEquipped = false;
		local bShieldEquipped = false;
		CampaignRegistry.charwizard.inventorylist = CampaignRegistry.charwizard.inventorylist or {};
		if LibraryData.isRecordDisplayClass("item", sClass) then
			for _,wndItem in pairs(getWindows()) do
				local sItemClass, sItemRecord = wndItem.shortcut.getValue();
				if sItemRecord == sRecord then
					bFound = true;
					if sItemRecord ~= sRecord then
						wndItem.count.setValue(wndItem.count.getValue() + 1);
					end
				end
			end
			if not bFound then
				local nCarried = 1;
				if DB.getValue(nodeSource, "type", "") == "Weapon" then 
					nCarried = 2;
				end
				if DB.getValue(nodeSource, "type", "") == "Armor" and not bArmorEquipped then
					nCarried = 2;					
				end
				if DB.getValue(nodeSource, "type", "") == "Shield" and not bShieldEquipped then
					nCarried = 2;					
				end
				local wndInventory = createWindow();
				wndInventory.shortcut.setValue(sClass, sRecord);
				wndInventory.carried.setValue(nCarried);
				wndInventory.name.setValue(DB.getValue(nodeSource, "name", ""));
				wndInventory.count.setValue(1);
			end
		end
		updateInventory();
	end
end

function updateCost()
	window.total_cost_pp.setValue(0);
	window.total_cost_gp.setValue(0);
	window.total_cost_sp.setValue(0);
	window.total_cost_cp.setValue(0);
	if CampaignRegistry.charwizard.inventorylist then
		nTotal = 0;
		for _,vItem in pairs(CampaignRegistry.charwizard.inventorylist) do
			local nodeTarget = DB.findNode(vItem.record);
			if nodeTarget then
				local sCost = DB.getValue(nodeTarget, "cost", "");
				local nItemTotal = 0;
				if string.match(sCost, "-") then
					sCost = "0";
				end
				sCost = sCost:gsub(",", "");
				local nCostAmount = tonumber(sCost:match("(%d+)"));
				local nNewCost = 0;

				if string.match(sCost, "pp") then
					nCostAmount = nCostAmount * 1000
				elseif string.match(sCost, "gp") then
					nCostAmount = nCostAmount * 100	
				elseif string.match(sCost, "sp") then
					nCostAmount = nCostAmount * 10	
				elseif string.match(sCost, "cp") then
					-- No change
				end			

				nItemTotal = nCostAmount * vItem.count;
				nTotal = nTotal + nItemTotal;
			end
		end
		if nTotal > 999 then
			local nPlatinumCoins = math.floor(nTotal / 1000);
			window.total_cost_pp.setValue(nPlatinumCoins);
			nTotal = nTotal - (nPlatinumCoins * 1000);
		end
		if nTotal > 99 then
			local nGoldCoins = math.floor(nTotal / 100);
			window.total_cost_gp.setValue(nGoldCoins);
			nTotal = nTotal - (nGoldCoins * 100);
		end
		if nTotal > 9 then
			local nSilverCoins = math.floor(nTotal / 10);
			window.total_cost_sp.setValue(nSilverCoins);
			nTotal = nTotal - (nSilverCoins * 10);		
		end
		if nTotal > 0 then
			window.total_cost_cp.setValue(nTotal);
		end
	end
end

function updateContainers()
		for _,w in ipairs(getWindows()) do
		if not w.hidden_locationpath then
			w.createControl("hsc", "hidden_locationpath");
		end
		local aSortPath, bContained = getInventorySortPath(self, w);
		w.hidden_locationpath.setValue(table.concat(aSortPath, "\a"));
		if w.name then
			if bContained then
				w.name.setAnchor("left", nil, "left", "absolute", 35 + (10 * (#aSortPath - 1)));
			else
				w.name.setAnchor("left", nil, "left", "absolute", 35);
			end
		end
		if w.nonid_name then
			if bContained then
				w.nonid_name.setAnchor("left", nil, "left", "absolute", 35 + (10 * (#aSortPath - 1)));
			else
				w.nonid_name.setAnchor("left", nil, "left", "absolute", 35);
			end
		end
	end
	
	applySort();
end

function getInventorySortPath(cList, w)
	if not w.name or not w.location then
		return {}, false;
	end
	
	local sName = ItemManager.getSortName(w.getDatabaseNode());
	local sLocation = StringManager.trim(w.location.getValue()):lower();
	if (sLocation == "") or (sName == sLocation) then
		return { sName }, false;
	end
	
	for _,wList in ipairs(cList.getWindows()) do
		local sListName = getSortName(wList.getDatabaseNode());
		if sListName == sLocation then
			local aSortPath = getInventorySortPath(cList, wList);
			table.insert(aSortPath, sName);
			return aSortPath, true;
		end
	end
	return { sLocation, sName }, false;
end

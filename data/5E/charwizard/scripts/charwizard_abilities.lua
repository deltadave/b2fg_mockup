-- 
-- Please see the license.html file included with this distribution for 
-- attribution and copyright information.
--
function onInit()
	ActionsManager.registerResultHandler("charwizardabilityroll", onRoll);

	if CampaignRegistry.charwizard.race and CampaignRegistry.charwizard.race.abilities then
		local w = Interface.findWindow("charwizard", "");
		for k,v in pairs(DataCommon.ability_ltos) do
			local nRaceAdj = CampaignRegistry.charwizard.race.abilities[string.lower(v)];
			w.summary.subwindow["summary_race_" .. string.lower(v)].setValue(nRaceAdj);
			self["race_" .. string.lower(v)].setValue(nRaceAdj);
		end
	end
end

function onRoll(rSource, rTarget, rRoll)
	local rMessage = ActionsManager.createActionMessage(rSource, rRoll);
	local resultMin = 0;
	local resultMinIndex = 0;
	local resultTotal = 0;
	for k,v in ipairs(rMessage.dice) do
		if (resultMin == 0) or (v.result < resultMin) then
			resultMinIndex = k;
			resultMin = v.result;
		end
		resultTotal = resultTotal + v.result;
	end
	if resultMinIndex > 0 then
		if UtilityManager.isClientFGU() then
			rMessage.dice.expr = "4d6d1";
			rMessage.dice[resultMinIndex].dropped = true;
			rMessage.dice[resultMinIndex].iconcolor = "7FFFFFFF";
		else
			table.remove(rMessage.dice, resultMinIndex);
			rMessage.text = rMessage.text .. " [DROPPED " .. resultMin .. "]";
		end
		resultTotal = resultTotal - resultMin;
	end
	Comm.deliverChatMessage(rMessage);

	for i=1,6 do
		local currStatControl = "genval" .. i; 	
		if self[currStatControl].getValue() == 0 then
			self[currStatControl].setValue(resultTotal);
			break;
		end
	end
end

function onCharGenPageChange()
	local sMethod = genmethod_select.getValue();
	local aAbilityScores = {};
	for i=1,6 do
		local nScore = window["genval" .. i].getValue();
		table.insert(aAbilityScores, nScore);
	end
	CharWizardManager.setAbilityScores(sMethod, aAbilityScores);
end

function recalcAbilityPointsSpent()
	local nPointTotal = 0;
	for i=1,6 do
		local currStatControl = "genval" .. i;
		local currCostControl = "cost_genval" .. i;
		local nCurrStat = self[currStatControl].getValue();
		if nCurrStat >= 15 then
			nPointTotal = nPointTotal + 9;
			self[currCostControl].setValue(9);	
		elseif nCurrStat == 14 then
			nPointTotal = nPointTotal + 7;
			self[currCostControl].setValue(7);			
		elseif nCurrStat == 13 then
			nPointTotal = nPointTotal + 5;
			self[currCostControl].setValue(5);			
		elseif nCurrStat == 12 then
			nPointTotal = nPointTotal + 4;
			self[currCostControl].setValue(4);			
		elseif nCurrStat == 11 then
			nPointTotal = nPointTotal + 3;
			self[currCostControl].setValue(3);			
		elseif nCurrStat == 10 then
			nPointTotal = nPointTotal + 2;
			self[currCostControl].setValue(2);			
		elseif nCurrStat == 9 then
			nPointTotal = nPointTotal + 1;
			self[currCostControl].setValue(1);
		elseif nCurrStat == 8 then
			self[currCostControl].setValue(0);			
		end
	end
	point_total.setValue(nPointTotal);
	local w = Interface.findWindow("charwizard", "");
	local aAlertList = w.alerts.getWindows();
	local bPointAlert = false;
	if point_total.getValue() < 27 then
		w.ability_alert.setVisible(true);
		for i=1,w.alerts.getWindowCount() do
			if aAlertList then
				if aAlertList[i].alert_label.getValue() == "ABILITIES: POINTS UNSPENT" or aAlertList[i].alert_label.getValue() == "ABILITIES: POINTS OVERSPENT" then
					aAlertList[i].alert_label.setValue("ABILITIES: POINTS UNSPENT");
					bPointAlert = true;
				end
			end
		end
		if not bPointAlert then
			local wndAlertList = w.alerts.createWindow();
			wndAlertList.alert_label.setValue("ABILITIES: POINTS UNSPENT");
			local x, y = wndAlertList.alert_label.getPosition();
			local _, h = wndAlertList.alert_label.getSize();			
			wndAlertList.alert_label.setStaticBounds(x, y, 165, h);			
			wndAlertList.alert_order.setValue(2);
			w.alerts.applySort();			
			bPointAlert = true;
		end
	elseif point_total.getValue() > 27 then
		w.ability_alert.setVisible(true);
		for i=1,w.alerts.getWindowCount() do
			if aAlertList then
				if aAlertList[i].alert_label.getValue() == "ABILITIES: POINTS UNSPENT" or aAlertList[i].alert_label.getValue() == "ABILITIES: POINTS OVERSPENT" then
					aAlertList[i].alert_label.setValue("ABILITIES: POINTS OVERSPENT");
					bPointAlert = true;					
				end
			end
		end
		if not bPointAlert then
			local wndAlertList = w.alerts.createWindow();
			wndAlertList.alert_label.setValue("ABILITIES: POINTS OVERSPENT");
			local x, y = wndAlertList.alert_label.getPosition();
			local _, h = wndAlertList.alert_label.getSize();			
			wndAlertList.alert_label.setStaticBounds(x, y, 175, h);			
			wndAlertList.alert_order.setValue(2);
			w.alerts.applySort();			
			bPointAlert = true;			
		end		
	else
		w.ability_alert.setVisible(false);
		for i=1,w.alerts.getWindowCount() do
			if aAlertList then
				if aAlertList[i].alert_label.getValue() == "ABILITIES: POINTS UNSPENT" or aAlertList[i].alert_label.getValue() == "ABILITIES: POINTS OVERSPENT" then
					aAlertList[i].close();
				end
			end
		end		
	end
end

function handleMoveAbilityUp(sName)
	local sNumber = tonumber(sName:match("%d+"));
	local nGiveValue = self["genval" .. sNumber].getValue();
	local nTakeNumber = tonumber(sNumber) - 1;
	local nTakeValue = self["genval" .. nTakeNumber].getValue();
	self["genval" .. nTakeNumber].setValue(nGiveValue);
	self["genval" .. sNumber].setValue(nTakeValue);
	return;
end

function handleMoveAbilityDown(sName)
	local sNumber = tonumber(sName:match("%d+"));
	local nGiveValue = self["genval" .. sNumber].getValue();
	local nTakeNumber = tonumber(sNumber) + 1;
	local nTakeValue = self["genval" .. nTakeNumber].getValue();
	self["genval" .. nTakeNumber].setValue(nGiveValue);
	self["genval" .. sNumber].setValue(nTakeValue);
	return;
end

function handleReroll()
	for i=1,6 do
		self["genval" .. i].setValue(0);
		
		local rRoll = { sType = "charwizardabilityroll", sDesc = "", aDice = aDice, nMod = 0 };	
		rRoll.aDice = {"d6", "d6", "d6", "d6"};
		ActionsManager.performAction(nil,nil,rRoll);
	end
end

function handleAbilityPointBuyUp(sNumber)
	local currStatControl = "genval" .. sNumber;
	local nCurrStatValue = self[currStatControl].getValue();
	if nCurrStatValue >= 15 then
		return;
	end
	
	nCurrStatValue = nCurrStatValue + 1;
	self[currStatControl].setValue(nCurrStatValue);
	
	self["genvalup" .. sNumber].setVisible(nCurrStatValue < 15);
	self["genvaldown" .. sNumber].setVisible(nCurrStatValue > 8);
	
	recalcAbilityPointsSpent();
end

function handleAbilityPointBuyDown(sNumber)
	local currStatControl = "genval" .. sNumber;

	local nCurrStatValue = self[currStatControl].getValue();
	if nCurrStatValue <= 8 then
		return;
	end
	
	nCurrStatValue = nCurrStatValue - 1;
	self[currStatControl].setValue(nCurrStatValue);
	
	self["genvalup" .. sNumber].setVisible(nCurrStatValue < 15);
	self["genvaldown" .. sNumber].setVisible(nCurrStatValue > 8);
	
	recalcAbilityPointsSpent();
end

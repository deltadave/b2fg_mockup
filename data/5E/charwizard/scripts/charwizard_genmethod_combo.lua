-- 
-- Please see the license.html file included with this distribution for 
-- attribution and copyright information.
--
function onInit()
	super.onInit();
	addItems(CharWizardManager.genmethod);
	onValueChanged();
end

function onValueChanged()
	local w = Interface.findWindow("charwizard", "");
	w.ability_alert.setVisible(false);
	local aAlertList = w.alerts.getWindows();
	for i=1,w.alerts.getWindowCount() do
		if aAlertList then
			if aAlertList[i].alert_label.getValue() == "ABILITIES: POINTS UNSPENT" then
				aAlertList[i].close();
			end
		end
	end
	local genval = {};
	genval["StatArray"] = {15, 14, 13, 12, 10, 8};
	if getValue() == "STANDARD ARRAY" then
		for k,v in pairs(genval.StatArray) do
			window["genval" .. k].setValue(v);
			window["genvalup" .. k].setVisible(false);			
			window["genvaldown" .. k].setVisible(false);
			window["label_cost_genval" .. k].setVisible(false);
			window["cost_genval" .. k].setVisible(false);
			window["genval_moveup" .. k].setVisible(true);
			window["genval_movedown" .. k].setVisible(true);			
		end
		window.point_total.setVisible(false);
		window.point_total_label.setVisible(false);
		window.reroll.setVisible(false);
		window.rerolllabel.setVisible(false);
		window.genmethod_dice_label.setVisible(false);
		window.genmethod_dice.setVisible(false);
		window.genmethod_drop_label.setVisible(false);
		window.genmethod_drop.setVisible(false);
		window.genval_movedown6.setVisible(false);
		window.genval_moveup1.setVisible(false);
		w.summary.subwindow.summary_genmethod.setValue("(STANDARD ARRAY)");		
		
	elseif getValue() == "DICE ROLL" then
		for k,v in pairs(genval.StatArray) do
			local rRoll = { sType = "charwizardabilityroll", sDesc = "", nMod = 0 };	
			rRoll.aDice = {"d6", "d6", "d6", "d6"};
			ActionsManager.performAction(nil,nil,rRoll);
			window["genval" .. k].setValue(0);
			window["genvalup" .. k].setVisible(false);
			window["genvaldown" .. k].setVisible(false);
			window["label_cost_genval" .. k].setVisible(false);
			window["cost_genval" .. k].setVisible(false);
			window["genval_moveup" .. k].setVisible(true);
			window["genval_movedown" .. k].setVisible(true);			
		end
		window.point_total.setVisible(false);
		window.point_total_label.setVisible(false);		
		window.reroll.setVisible(true);
		window.rerolllabel.setVisible(true);
		window.genmethod_dice_label.setVisible(false);
		window.genmethod_dice.setVisible(false);
		window.genmethod_drop_label.setVisible(false);
		window.genmethod_drop.setVisible(false);
		window.genval_movedown6.setVisible(false);
		window.genval_moveup1.setVisible(false);
		w.summary.subwindow.summary_genmethod.setValue("(DICE ROLL)");		
	elseif getValue() == "POINT BUY" then
		for k,v in pairs(genval.StatArray) do
			window["genval" .. k].setValue(8);
			window["cost_genval" .. k].setValue(0);			
			window["genvalup" .. k].setVisible(true);
			window["label_cost_genval" .. k].setVisible(true);
			window["cost_genval" .. k].setVisible(true);
			window["genval_moveup" .. k].setVisible(false);
			window["genval_movedown" .. k].setVisible(false);			
		end
		window.point_total.setValue(0);
		window.point_total.setVisible(true);
		window.point_total_label.setVisible(true);		
		window.reroll.setVisible(false);
		window.rerolllabel.setVisible(false);
		window.genmethod_dice_label.setVisible(false);
		window.genmethod_dice.setVisible(false);
		window.genmethod_drop_label.setVisible(false);
		window.genmethod_drop.setVisible(false);
		window.genval_movedown6.setVisible(false);
		window.genval_moveup1.setVisible(false);
		w.ability_alert.setVisible(true);
		local wndAlertList = w.alerts.createWindow();
		wndAlertList.alert_label.setValue("ABILITIES: POINTS UNSPENT");
		wndAlertList.alert_order.setValue(2);
		w.alerts.applySort();		
		w.summary.subwindow.summary_genmethod.setValue("(POINT BUY)");
	elseif getValue() == "MANUAL ENTRY" then
		for k,v in pairs(genval.StatArray) do
			window["genval" .. k].setValue(10);		
			window["genvalup" .. k].setVisible(false);
			window["genvaldown" .. k].setVisible(false);
			window["label_cost_genval" .. k].setVisible(false);
			window["cost_genval" .. k].setVisible(false);
			window["genval_moveup" .. k].setVisible(false);
			window["genval_movedown" .. k].setVisible(false);			
		end
		window.point_total.setVisible(false);
		window.point_total_label.setVisible(false);
		window.reroll.setVisible(false);
		window.rerolllabel.setVisible(false);
		window.genmethod_dice_label.setVisible(false);
		window.genmethod_dice.setVisible(false);
		window.genmethod_drop_label.setVisible(false);
		window.genmethod_drop.setVisible(false);
		w.summary.subwindow.summary_genmethod.setValue("(MANUAL ENTRY)");		
	end
	w.ability_GateCheck.setValue(1);
	if w.getGateStatus() then
		w.ability_alert.setVisible(false);
		w.commit.setEnabled(true);
		w.commit.setFrame("buttonup", 5,5,5,5);
	end
	w.calcSummaryStats();
end
-- 
-- Please see the license.html file included with this distribution for 
-- attribution and copyright information.
--

function onInit()
	super.onInit();
	onValueChanged();
end

function update(bReadOnly)
	setReadOnly(bReadOnly);
end

function onValueChanged()
	CampaignRegistry.charwizard.abilities = CampaignRegistry.charwizard.abilities or {};
	
	local w = Interface.findWindow("charwizard", "");
	local nAbility = tonumber(getName():match("%d+"));
	local nRaceAbility = w.summary.subwindow["summary_race_" .. (DataCommon.ability_ltos[DataCommon.abilities[nAbility]]):lower()].getValue();
	w.summary.subwindow["summary_" .. getName()].setValue(getValue() + nRaceAbility);
	
	CampaignRegistry.charwizard.abilities[getName()] = getValue();
	w.calcSummaryStats();
end

function onDragStart(button, x, y, draginfo)
	local aAttributes = {};
	draginfo.setType("number");
	draginfo.setNumberData(self.getValue());
	draginfo.setShortcutData(window.getClass(), self.getName());
	for i=1,6 do
		aAttributes[i] = window["genval" .. i].getValue();
	end
	draginfo.setCustomData(aAttributes);
	return true;
end

function onDrop(x, y, draginfo)
	local sDragType = draginfo.getType();
	local sClass, sControl = draginfo.getShortcutData();
	local sNumber = self.getName():match("%d+");
	local aAttributes = draginfo.getCustomData();
	if aAttributes then
		window[sControl].setValue(aAttributes[tonumber(sNumber)]);
	end
end

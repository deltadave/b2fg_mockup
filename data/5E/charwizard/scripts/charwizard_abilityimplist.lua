-- 
-- Please see the license.html file included with this distribution for 
-- attribution and copyright information.
--

function onInit()
	addAbilityImprovements();
end

function addAbilityImprovements()
	if CampaignRegistry.charwizard.feats and CampaignRegistry.charwizard.feats.class then
		updateASI(CampaignRegistry.charwizard.feats.class)
	end
	applySort();
end

function updateASI(aASIList)
	local aClassNames = {};
	for _,vASI in pairs(aASIList) do
		local wndASI = createWindow();
		wndASI.abilityimp_lvl.setValue(vASI.level);
		wndASI.class.setValue(vASI.name);
		for _,v in ipairs(aASIList) do
			if not StringManager.contains(aClassNames, vASI.name) then
				local wndASILabel = createWindowWithClass("asi_label", "");
				wndASILabel.abilityimp_lvl.setValue(0);
				wndASILabel.class.setValue(vASI.name);
				wndASILabel.asi_classname.setValue(vASI.name);
				table.insert(aClassNames, vASI.name);
			end
		end
	end
	applySort();
end
--]]
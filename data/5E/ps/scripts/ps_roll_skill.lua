-- 
-- Please see the license.html file included with this distribution for 
-- attribution and copyright information.
--

function action(draginfo)
	local aParty = {};
	for _,v in pairs(window.list.getWindows()) do
		local rActor = ActorManager.getActor("pc", v.link.getTargetDatabaseNode());
		if rActor then
			table.insert(aParty, rActor);
		end
	end
	if #aParty == 0 then
		return true;
	end
	
	local sSkill = DB.getValue("partysheet.skillselected", "");
	
	ModifierStack.lock();
	for _,v in pairs(aParty) do
		ActionSkill.performPartySheetRoll(nil, v, sSkill);
	end
	ModifierStack.unlock(true);

	return true;
end

function onButtonPress()
	return action();
end			


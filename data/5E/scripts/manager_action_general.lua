-- 
-- Please see the license.html file included with this distribution for 
-- attribution and copyright information.
--

function onInit()
	ActionsManager.registerModHandler("dice", modRoll);
	ActionsManager.registerResultHandler("dice", onRoll);
end

function modRoll(rSource, rTarget, rRoll)
	ActionsManager2.encodeDesktopMods(rRoll);
	
	if UtilityManager.isClientFGU() then
		if #(rRoll.aDice) == 1 and rRoll.aDice[1].type == "d20" then
			ActionsManager2.encodeAdvantage(rRoll);
		end
	else
		if #(rRoll.aDice) == 1 and rRoll.aDice[1] == "d20" then
			ActionsManager2.encodeAdvantage(rRoll);
		end
	end
end

function onRoll(rSource, rTarget, rRoll)
	ActionsManager2.decodeAdvantage(rRoll);

	local rMessage = ActionsManager.createActionMessage(rSource, rRoll);
	Comm.deliverChatMessage(rMessage);
end


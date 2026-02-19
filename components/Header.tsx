import { Notifications } from "@/components/Notifications";
import { UserButton } from "./UserButton";
import { SearchTrigger } from "./SearchTrigger";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 lg:h-[60px]">
            <div className="flex-1">
                <SearchTrigger />
            </div>
            <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <Notifications />
                <UserButton />
            </div>
        </header>
    );
}

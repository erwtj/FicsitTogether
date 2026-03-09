import { useEffect } from "react";

function BuyMeCoffeeWidget() {
    useEffect(() => {
        document.body.classList.add("show-bmc");
        return () => {
            document.body.classList.remove("show-bmc");
        };
    }, []);

    return null;
}

export default BuyMeCoffeeWidget;

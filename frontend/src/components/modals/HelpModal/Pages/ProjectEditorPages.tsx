import {VideoAccordion} from "../VideoAccordion.tsx";
import "../HelpModal.tsx.css"


export function NodesPageContent() {

    const ScrollToRef = (key: string) => {
        const ref = document.getElementById(key);
        ref!.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    return (
        <div className="text-start justify-content-center">
            <h1>Nodes</h1>
            <p>Nodes are the main building blocks for your production lines.</p>
            <p className="mb-0">There are 4 types of nodes:</p>
            <ul>
                <li>
                    <button
                        type="button"
                        className="btn btn-link p-0 fw-bold align-baseline text-decoration-none"
                        onClick={() => ScrollToRef("input-nodes")}
                    >
                        Input Nodes
                    </button>
                    : These nodes are used to input resources from other factories or from ore nodes.
                </li>
                <li>
                    <button
                        type="button"
                        className="btn btn-link p-0 fw-bold align-baseline text-decoration-none"
                        onClick={() => ScrollToRef("recipe-nodes")}
                    >
                        Recipe Nodes
                    </button>
                    : These nodes represent a step in your manufacturing chain.
                </li>
                <li>
                    <button
                        type="button"
                        className="btn btn-link p-0 fw-bold align-baseline text-decoration-none"
                        onClick={() => ScrollToRef("output-nodes")}
                    >
                        Output Nodes
                    </button>
                    : These nodes are used to output resources from your factory or to sink them.
                </li>
                <li>
                    <button
                        type="button"
                        className="btn btn-link p-0 fw-bold align-baseline text-decoration-none"
                        onClick={() => ScrollToRef("power-nodes")}
                    >
                        Power Nodes
                    </button>
                    : These nodes generate power based on the input amounts of the item amounts.
                </li>
            </ul>
            <p>
                Nodes can be placed by 2 different methods. The first is by double clicking on the grid or pressing the space bar.
                The second is dragging an edge from a input or output of a node and releasing it.
                In both situations a screen will pop up where you need to select the recipe or type of node you want to place.
            </p>
            <VideoAccordion source="/media/HelpModal/Videos/NodesPlacement.webm" title="Show Node Placement Video"/>

            <h3 id="input-nodes" className="mt-3">Input Nodes</h3>
            <p>
                Input nodes are used to input resources from other factories or ore deposits. The input amount can be set in the text area.
            </p>
            <VideoAccordion source="/media/HelpModal/Videos/InputNode.webm" title="Show Input Node Video"/>

            <h3 id="recipe-nodes" className="mt-3">Recipe Nodes</h3>
            <p>
                Recipe nodes are your main node types. These will represent a step in your manufacturing chain.
                A recipe node can represents more than one building but all with the same recipe.
            </p>
            <p>
                This node automatically calculates the required input and output amounts based on the recipe and the items coming in or going out.
                If there is not enough of one input item, it uses the least available input to determine the final amounts.
            </p>
            <VideoAccordion source="/media/HelpModal/Videos/RecipeNode.webm" title="Show Recipe Node Calculations Video"/>

            <h3 id="output-nodes" className="mt-3">Output Nodes</h3>
            <p>
                Output nodes are used to output or sink items that are produced in your factory. They will automatically adjust there amount based on the incoming item amounts.
            </p>
            <VideoAccordion source="media/HelpModal/Videos/OutputNode.webm" title="Show Output Node Video"/>

            <h3 id="power-nodes" className="mt-3">Power Nodes</h3>
            <p>
                A power node is a node that generates power based on the input amounts of the item amounts.
                (All power nodes where there will be waste production is are classified as recipe nodes, but the power gain will be considered in the side panel)
            </p>
        </div>
    )
}

export function EdgesPageContent() {
    return (
        <div className="text-start justify-content-center">
            <h1>Edges</h1>
            <p>
                Edges are the connections between nodes. They are used to transport items from one node to another.
            </p>
            <p>
                Edges can be placed by dragging from a input or output handle of a node to a output or input handle of another node.
                When released on the grid it will open the recipe selection of al possible recipes with this item as input or output.
            </p>
            <p>
                The throughput of an edge can be set by editing the number in the text field.
                If this number is greater than the available input the edge will be red.
            </p>
            <p>
                Edges that are transporting fluids will have a flow animation.
            </p>
            <VideoAccordion source="/media/HelpModal/Videos/Edges.webm" title="Show Edge Creation Video"/>

            <h2>Custom Paths</h2>
            <p>
                Sometimes the automatic edge path will not suit the path it needs to take. In this situation you can create points where the edge will go trough.
                To Create a point you select the edge, than you click on a plus symbol, than you can drag that point around.
            </p>
            <VideoAccordion source="/media/HelpModal/Videos/CustomEdge.webm" title="Show Custom Path Creation Video"/>

        </div>

    )
}

export function SloopingPageContent() {

    const ScrollToRef = (key: string) => {
        const ref = document.getElementById(key);
        ref!.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    return (
        <div className="text-start justify-content-center">
            <h1>Using Somersloops</h1>
            <p> Somersloops can be used to multiple the output produced by buildings. This can be configured in the sloop configuration screen, that can be opened by clicking on the somersloop button on a recipe node.</p>
            <h3>Adding a building</h3>
            <p>
                To configure a building u first need to click on the add building card. This will add a building with the following fields:
            </p>
            <ul>
                <li>
                    <img alt="somer sloop" className="sloopcard-images" src="/media/FactoryGame/Prototype/WAT/UI/Wat_1_256.webp"/>
                    <b>Somersloop Count</b>: This configures the amount of somersloops in this building
                </li>
                <li>
                    <img alt="somer sloop" className="sloopcard-images" src="/media/FactoryGame/Resource/Parts/ModularFrameHeavy/UI/IconDesc_ModularFrameHeavy_256.webp"/>
                    <b>Items Produced</b>: This is the amount of items produced by the machine per minute. This is the amount that u can set in the building in the game, so it doesnt include the extra sloop factor.
                </li>
                <li>
                    <img alt="somer sloop" className="sloopcard-images" src="/media/Clock_speed.webp"/>
                    <b>Overclock</b>: This is the clock speed of the building as set in the game.
                </li>
                <li>
                    <img alt="somer sloop" className="sloopcard-images" src="/media/AlienOverclocking.webp"/>
                    <b>Effective Overclock</b>: This is the effective clock speed of the building, this means the clock speed of the building times the slooped factor. This is the number that determines the actual production of the building and cannot be configured manually.
                </li>
            </ul>
            <VideoAccordion source="/media/HelpModal/Videos/Slooping.webm" title="Show slooping video"/>
            <h3>Important Notes</h3>
            <p>There are 3 ways to determine the limitations of the buildings you can add to the slooping. These 3 ways are prioritized from above to below</p>
            <ul>
                <li>
                    <button
                        type="button"
                        className="btn btn-link p-0 fw-bold align-baseline text-decoration-none"
                        onClick={() => ScrollToRef("input-based")}
                    >
                        Input Based
                    </button>
                    : This set a max total clock speed
                </li>
                <li>
                    <button
                        type="button"
                        className="btn btn-link p-0 fw-bold align-baseline text-decoration-none"
                        onClick={() => ScrollToRef("output-based")}
                    >
                        Output Based
                    </button>
                    : These nodes represent a step in your manufacturing chain.
                </li>
                <li>
                    <button
                        type="button"
                        className="btn btn-link p-0 fw-bold align-baseline text-decoration-none"
                        onClick={() => ScrollToRef("empty-based")}
                    >
                        Empty Based
                    </button>
                    : This wil not set any limitations
                </li>
            </ul>
            <p>NOTE: If the inputs or outputs of a building change and the current limitations can no longer be maintained, the slooping configuration will reset to empty.</p>
            <h3 id="input-based">Input based</h3>
            <p>
                If there are inputs configure for the node there will be a maximum total clock speed than can be set in the sloop configuration.
                If this maximum is exceeded u cannot save the configuration.
                If your configuration is less than this maximum, only the buildings configured will use slooping and the rest of the buildings use the standard rates.
            </p>
            <p>
                For example in the example video we have a total maximum overclock of 300%.
                We configure one building with 250% and 4 sloops, which means that for this 250% we double the output and for the other 50% normal rates are used.
            </p>
            <VideoAccordion source="/media/HelpModal/Videos/SloopingInputBased.webm" title="Show input based slooping video"/>
            <h3 id="output-based">Output based</h3>
            <p>
                If there ar not inputs configured for the node, but there is a output there will be a maximum total effective overclock.
                If this maximum is exceeded u cannot save the configuration.
                If your configuration is less than this maximum, only the buildings configured will use slooping and the rest of the buildings use the standard rates.
            </p>
            <p>
                For example in the example video we have a total maximum effective overclock of 400%.
                We configure one building with 150% overclock and 4 sloops, which means that the total effective overclock for this building is 300%.
                Thus for the other 100% effective overclock normal rates are used.
                Which results in a total building factor of 250% (150% with doubling and 100% with normal rates).
            </p>
            <VideoAccordion source="/media/HelpModal/Videos/OutputBasedSlooping.webm" title="Show output based slooping video"/>
            <h3 id ="empty-based">Empty Based</h3>
            <p>
                If there are not inputs and outputs configured for the node there will be no maximum effective overclock and you can configure as many buildings as you want.
                The node will there for always pick the factor based on the total overclock that is configured
            </p>
        </div>

    )
}

export function SidePanelPageContent() {
    return (
        <div className="text-start justify-content-center">
            <h1>Side Panel</h1>
            <p>
                The side panel can be accessed trough the arrow at the left of your screen.
                Here you will find the button to go pack to the folder and the settings button to change your settings.
                You can also change your project name and description here, by pressing on your project name at the left top.
            </p>
            <p>
                You can also find the following 4 information area's in your side panel:
            </p>
            <ul>
                <li><b>Input</b>: Here you can find all inputs used by your factory.</li>
                <li><b>Output</b>: Here you can find all outputs produced by your factory.</li>
                <li><b>Buildings</b>: Here you can find the amount of each building used by your factory.</li>
                <li><b>Power</b>: Here you can see the power used and produced by your factory buildings</li>
            </ul>


        </div>



    )
}


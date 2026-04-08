import {VideoAccordion} from "../VideoAccordion.tsx";
import "../HelpModal.tsx.css"

const scrollToRef = (key: string) => {
    const ref = document.getElementById(key);
    ref!.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function NodesPageContent() {
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
                        onClick={() => scrollToRef("input-nodes")}
                    >
                        Input Nodes
                    </button>
                    : These nodes are used to input resources from other factories or from ore nodes.
                </li>
                <li>
                    <button
                        type="button"
                        className="btn btn-link p-0 fw-bold align-baseline text-decoration-none"
                        onClick={() => scrollToRef("recipe-nodes")}
                    >
                        Recipe Nodes
                    </button>
                    : These nodes represent a step in your manufacturing chain.
                </li>
                <li>
                    <button
                        type="button"
                        className="btn btn-link p-0 fw-bold align-baseline text-decoration-none"
                        onClick={() => scrollToRef("output-nodes")}
                    >
                        Output Nodes
                    </button>
                    : These nodes are used to output resources from your factory or to sink them.
                </li>
                <li>
                    <button
                        type="button"
                        className="btn btn-link p-0 fw-bold align-baseline text-decoration-none"
                        onClick={() => scrollToRef("power-nodes")}
                    >
                        Power Nodes
                    </button>
                    : These nodes generate power based on input item amounts.
                </li>
            </ul>
            <p>
                Nodes can be placed using 2 different methods. The first is by double-clicking on the grid.
                The second is dragging an edge from an input or output of a node and releasing it.
                In both situations, a screen will pop up where you need to select the recipe or type of node you want to place.
            </p>
            <VideoAccordion source="/media/HelpModal/Videos/NodesPlacement.webm" title="Show Node Placement Video"/>

            <h3 id="input-nodes" className="mt-3">Input Nodes</h3>
            <p>
                Input nodes are used to input resources from other factories or ore deposits. The input amount can be set in the text area.
            </p>
            <VideoAccordion source="/media/HelpModal/Videos/InputNode.webm" title="Show Input Node Video"/>

            <h3 id="recipe-nodes" className="mt-3">Recipe Nodes</h3>
            <p>
                Recipe nodes are your main node type. These represent a step in your manufacturing chain.
                A recipe node can represent more than one building, as long as they all use the same recipe.
            </p>
            <p>
                This node automatically calculates required input and output amounts based on the recipe and the items coming in or going out.
                If there is not enough of one input item, it uses the least available input to determine the final amounts.
            </p>
            <VideoAccordion source="/media/HelpModal/Videos/RecipeNode.webm" title="Show Recipe Node Calculations Video"/>

            <h3 id="output-nodes" className="mt-3">Output Nodes</h3>
            <p>
                Output nodes are used to output or sink items produced by your factory. They automatically adjust their amount based on incoming item amounts.
            </p>
            <VideoAccordion source="/media/HelpModal/Videos/OutputNode.webm" title="Show Output Node Video"/>

            <h3 id="power-nodes" className="mt-3">Power Nodes</h3>
            <p>
                A power node generates power based on input item amounts.
                (All power nodes where waste is produced are classified as recipe nodes, but the power gain is still considered in the side panel.)
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
                Edges can be placed by dragging from an input or output handle of a node to an output or input handle of another node.
                When released on the grid, it will open the recipe selection of all possible recipes with this item as input or output.
            </p>
            <p>
                The throughput of an edge can be set by editing the number in the text field.
                If this number is greater than the available input, the edge will be red.
            </p>
            <p>
                Edges transporting fluids will have a flow animation.
            </p>
            <VideoAccordion source="/media/HelpModal/Videos/Edges.webm" title="Show Edge Creation Video"/>

            <h3 className="mt-3">Auto-fix Upstream</h3>
            <p>
                If the auto-fix upstream setting is enabled, when you edit the throughput of an edge, it will automatically adjust the throughputs of the edges before it to match the new throughput.
                This is useful for quickly adjusting the throughput of a part of your factory without having to manually adjust all the edges leading to it.
            </p>
            <p>
                This auto-fix works with feedback loops as well as branching and returning paths. It will automatically adjust all edges and spawned nodes that are affected by the change.
            </p>

            <h3>Custom Paths</h3>
            <p>
                Sometimes the automatic edge path will not follow the route you need. In this case, you can create points that the edge will go through.
                To create a point, select the edge, click the plus symbol, then drag the point around.
            </p>
            <VideoAccordion source="/media/HelpModal/Videos/CustomEdge.webm" title="Show Custom Path Creation Video"/>
        </div>
    )
}

export function SloopingPageContent() {
    return (
        <div className="text-start justify-content-center">
            <h1>Using Somersloops</h1>
            <p>Somersloops can be used to multiply the output produced by buildings. This can be configured in the sloop configuration screen, which can be opened by clicking the somersloop button on a recipe node.</p>
            <h3>Adding a building</h3>
            <p>
                To configure a building, you first need to click the add building card. This adds a building with the following fields:
            </p>
            <ul>
                <li>
                    <img alt="somer sloop" className="sloopcard-images" src="/media/FactoryGame/Prototype/WAT/UI/Wat_1_256.webp"/>
                    <b>Somersloop Count</b>: This configures the number of somersloops in this building.
                </li>
                <li>
                    <img alt="somer sloop" className="sloopcard-images" src="/media/FactoryGame/Resource/Parts/ModularFrameHeavy/UI/IconDesc_ModularFrameHeavy_256.webp"/>
                    <b>Items Produced</b>: This is the number of items produced by the machine per minute. This is the amount you can set in-game, so it does not include the extra sloop factor.
                </li>
                <li>
                    <img alt="somer sloop" className="sloopcard-images" src="/media/Clock_speed.webp"/>
                    <b>Overclock</b>: This is the clock speed of the building as set in the game.
                </li>
                <li>
                    <img alt="somer sloop" className="sloopcard-images" src="/media/AlienOverclocking.webp"/>
                    <b>Effective Overclock</b>: This is the effective clock speed of the building, which means the building clock speed multiplied by the sloop factor. This number determines actual production and cannot be configured manually.
                </li>
            </ul>
            <VideoAccordion source="/media/HelpModal/Videos/Slooping.webm" title="Show slooping video"/>
            
            <h3 className="mt-3">Important Notes</h3>
            <p>There are 3 ways to determine the limits of the buildings you can add to slooping. These 3 ways are prioritized from top to bottom.</p>
            <ul>
                <li>
                    <button
                        type="button"
                        className="btn btn-link p-0 fw-bold align-baseline text-decoration-none"
                        onClick={() => scrollToRef("input-based")}
                    >
                        Input Based
                    </button>
                    : This sets a maximum total clock speed.
                </li>
                <li>
                    <button
                        type="button"
                        className="btn btn-link p-0 fw-bold align-baseline text-decoration-none"
                        onClick={() => scrollToRef("output-based")}
                    >
                        Output Based
                    </button>
                    : This sets a maximum total effective overclock.
                </li>
                <li>
                    <button
                        type="button"
                        className="btn btn-link p-0 fw-bold align-baseline text-decoration-none"
                        onClick={() => scrollToRef("empty-based")}
                    >
                        Empty Based
                    </button>
                    : This does not set any limitations.
                </li>
            </ul>
            <p className="border-start border-3 ps-2 pb-1 text-muted">If the inputs or outputs of a building change and the current limits can no longer be maintained, the slooping configuration resets to empty.</p>
            
            <h3 className="mt-3" id="input-based">Input based</h3>
            <p>
                If there are inputs configured for the node, there will be a maximum total clock speed that can be set in the sloop configuration.
                If this maximum is exceeded, you cannot save the configuration.
                If your configuration is below this maximum, only the configured buildings will use slooping and the rest will use standard rates.
            </p>
            <p>
                For example, in the sample video we have a total maximum overclock of 300%.
                We configure one building with 250% and 4 sloops, which means we double the output for that 250%, and normal rates are used for the other 50%.
            </p>
            <VideoAccordion source="/media/HelpModal/Videos/SloopingInputBased.webm" title="Show input based slooping video"/>
            
            <h3 className="mt-3" id="output-based">Output based</h3>
            <p>
                If there are no inputs configured for the node, but there is an output, there will be a maximum total effective overclock.
                If this maximum is exceeded, you cannot save the configuration.
                If your configuration is below this maximum, only the configured buildings will use slooping and the rest will use standard rates.
            </p>
            <p>
                For example, in the sample video we have a total maximum effective overclock of 400%.
                We configure one building with 150% overclock and 4 sloops, which means that the total effective overclock for this building is 300%.
                So the other 100% effective overclock uses normal rates.
                This results in a total building factor of 250% (150% with doubling and 100% with normal rates).
            </p>
            <VideoAccordion source="/media/HelpModal/Videos/OutputBasedSlooping.webm" title="Show output based slooping video"/>
            
            <h3 className="mt-3" id="empty-based">Empty Based</h3>
            <p>
                If there are no inputs or outputs configured for the node, there is no maximum effective overclock and you can configure as many buildings as you want.
                The node therefore always picks the factor based on the total configured overclock.
            </p>
        </div>
    )
}

export function SidePanelPageContent() {
    return (
        <div className="text-start justify-content-center">
            <h1>Side Panel</h1>
            <p>
                The side panel can be accessed through the arrow on the left side of your screen.
                Here you will find the button to go back to the folder, a download button and a button to open your settings.
                You can also change your project name and description here by clicking your project name in the top-left corner.
            </p>
            <p>
                You can also find the following 4 information areas in your side panel:
            </p>
            <ul>
                <li><b>Input</b>: All inputs used by your factory.</li>
                <li><b>Output</b>: All outputs produced by your factory.</li>
                <li><b>Buildings</b>: The amount of each building used by your factory.</li>
                <li><b>Power</b>: The power used and produced by your factory buildings.</li>
            </ul>
            
            <p className="border-start border-3 ps-2 pb-1 text-muted">
                If you enable I/O summing in your settings, the input and output will be summed against each other. 
                Meaning that if a factory produces 10 iron and consumes 7 iron, it will show 3 iron output and no iron input.
            </p>
        </div>
    )
}

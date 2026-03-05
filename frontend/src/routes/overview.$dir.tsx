import {createFileRoute, notFound, useNavigate} from '@tanstack/react-router'
import {redirect} from "@tanstack/react-router";
import {fetchAllProjectsInDirectory, fetchDirectoryContent} from "../api/apiCalls.ts";
import { getAllResources, getItem, getResource, type Resource } from "ficlib";
import { useMemo } from "react";
import {buildUsageMaps} from "../utils/overviewUtil.ts";
import "./overview.$dir.tsx.css"
import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import {isItemSolid, roundTo3Decimals} from "../utils/throughputUtil.ts";
import {ArrowLeft, FileEarmarkBarGraph, Folder } from "react-bootstrap-icons";
import {Button, ButtonGroup, Card, Dropdown } from "react-bootstrap";

type itemUsageData = {
    input: number,
    output: number,
}

export const Route = createFileRoute('/overview/$dir')({
    component: OverviewPage,
    staticData: {
        showNav: true,
        title: "Ficsit Together | Overview"
    },
    loader: async ({context, params: {dir}}) => {
        const { auth } = context;
        if (!auth) throw redirect({ to: '/login', replace: true })

        const [directory, charts] = await Promise.all([
            fetchDirectoryContent(auth, dir).catch(err => {
                if (err.response?.status === 403 || err.response?.status === 404) {
                    throw notFound()
                }
                throw err
            }),
            fetchAllProjectsInDirectory(auth, dir).catch(err => {
                if (err.response?.status === 403 || err.response?.status === 404) {
                    throw notFound()
                }
                throw err
            }),
        ])

        if (directory.id === directory.parentDirectoryId) {
            throw redirect({ to: '/home', replace: true })
        }

        const parentDir = await fetchDirectoryContent(auth, directory.parentDirectoryId).catch(err => {
            if (err.response?.status === 403 || err.response?.status === 404) {
                throw notFound()
            }
            throw err
        })


        return { directory, parentDir, charts }
    }

})

function OverviewPage() {
    const { dir: dirId } = Route.useParams();
    return (
        <OverviewPageContent key={dirId}/> // Force remount when directory changes to reset state
    );
}

const allResources: Set<string> = new Set(getAllResources().map((resource: Resource) => resource.className));


function countToDisplay(itemClassName: string, amount: number): string {
    const item = getItem(itemClassName)!;
    const isSolid = isItemSolid(item);
    let result = "";
    if (isSolid) {
        amount = roundTo3Decimals(amount);
    } else {
        amount = roundTo3Decimals(amount / 1000);
    }

    result = amount.toString();

    if (Math.abs(amount) >= 100000) {
        result = amount.toExponential(2);
    }
    return isSolid ? result : `${result} m³`;
}

function ResourceCircle({ amount, itemClassName }: { amount: number; itemClassName: string }) {
    const resource = getResource(itemClassName)!;
    const item = getItem(itemClassName)!;
    const maxAmount = resource.harvestableAmount;

    const normalizedAmount = amount / (isItemSolid(item) ? 1 : 1000);
    const displayAmount = roundTo3Decimals(normalizedAmount);

    const isInfinite = maxAmount === 0;

    let percentage = (normalizedAmount / maxAmount) * 100;
    if (isInfinite) {
        percentage = 100;
    }
    const warning = maxAmount > 0.001 && percentage > 100;

    const color = `hsl(${(1 - percentage / 100) * 120}, 75%, 50%)`;
    const displayPercentage = percentage.toFixed(2);

    let circleStyle = buildStyles({
        pathColor: `${!isInfinite ? color : `#${item.fluidColor.slice(0, -2)}`}`,
        trailColor: '#393f45',
        strokeLinecap: "round",
    })
    if (warning) {
        circleStyle = buildStyles({
            pathColor: "darkred",
            trailColor: '#393f45',
            strokeLinecap: "round",
        })
    }

    return (
        <center>
            <div className="resourceCircle">
                <CircularProgressbarWithChildren value={percentage} styles={circleStyle}>
                    <img
                        className="circleImage"
                        src={`/media/${item.icon}_256.webp`}
                        alt="Image failed to load"
                        draggable={false}
                    />
                    {<span className={warning ? "text-danger" : ""} style={{ fontSize: '0.875rem' }}>{!isInfinite ? displayPercentage + "%" : ""}</span>}
                </CircularProgressbarWithChildren>

                <center>
                    <div>
                        <h4 style={{
                            marginBottom: 0,
                            fontSize: '.94rem',
                            marginTop: '0.5rem'
                        }} className={warning ? "text-danger" : ""}>{resource.displayName}</h4>
                        <span className={warning ? "text-danger" : ""} style={{ fontSize: '0.875rem' }}>{displayAmount} { !isInfinite ? `/ ${maxAmount}` : "/ ∞"}</span>
                    </div>
                </center>
            </div>
        </center>
    )
}
function ItemCard({ itemUsageData, itemClassName }: { itemUsageData: itemUsageData; itemClassName: string }) {
    const item = getItem(itemClassName)!;
    const netAmount = itemUsageData.output - itemUsageData.input;

    return (
        <Card key={itemClassName} className="itemCardOverview">
            <Card.Img variant="top" src={`/media/${item.icon}_256.webp`} className="itemCardImage mb-1" draggable={false} />
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '3rem' }}>
                <Card.Title className="text-center m-0">
                    <h3 className="cardTitle m-0">{item.displayName}</h3>
                </Card.Title>
            </div>
            <Card.Body className="text-center pt-0 pe-1 ps-1 flex-grow-1 d-flex flex-column justify-content-end">
                Input : {countToDisplay(itemClassName, itemUsageData.input)} <br/>
                Output : {countToDisplay(itemClassName, itemUsageData.output)} <br/>
                <span className={netAmount === 0 ? "text-body-tertiary" : netAmount < 0 ? "text-danger" : "text-success"}>
            Netto : {countToDisplay(itemClassName, netAmount)}
        </span>
            </Card.Body>
        </Card>
    )
}



function OverviewPageContent() {
    const { directory, parentDir, charts } = Route.useLoaderData();
    const navigate = useNavigate();

    const { resourceMap, itemMap } = useMemo(() => {
        if (!charts) return { resourceMap: new Map<string, itemUsageData>(), itemMap: new Map<string, itemUsageData>() };
        return buildUsageMaps(charts, allResources);
    }, [charts]);

    const noDropDown = parentDir.id === parentDir.parentDirectoryId && directory.subDirectories.length === 0;

    return (
        <div>
            <div className="dir-sticky-wrap ">
                <Dropdown as={ButtonGroup} className="dir-dropdown">
                    <Button className="btn-dir"
                            onClick = {() => {
                                navigate({ to: `/directories/${directory.id}`, replace: true })
                            }}

                    >
                        <ArrowLeft size={16} style={{ marginBottom: 0, marginRight: '0.5rem'}} />
                        <Folder size={20} style={{ marginBottom: 0, marginRight: '0.5rem'}} />
                        {directory.name}
                    </Button>

                    <Dropdown.Toggle split className="btn-dir-toggle" id="dropdown-split-basic" disabled={noDropDown} />

                    <Dropdown.Menu>
                        {parentDir.parentDirectoryId !== parentDir.id && (
                            <>
                                <Dropdown.Item href={`/overview/${directory.parentDirectoryId}`}>
                                    <ArrowLeft size={18} style={{ marginBottom: '0.125rem', marginRight: '0.5rem' }}/>
                                    <FileEarmarkBarGraph size={18} style={{ marginBottom: '0.125rem', marginRight: '0.5rem' }} />
                                    {parentDir.name}
                                </Dropdown.Item>
                                {directory.subDirectories.length > 0 && <Dropdown.Divider />}
                            </>
                        )}
                        {directory.subDirectories.map((subDir) => (
                            <Dropdown.Item key={subDir.id} href={`/overview/${subDir.id}`}>
                                <FileEarmarkBarGraph size={18} style={{ marginBottom: '0.125rem', marginRight: '0.5rem' }} />
                                {subDir.name}
                            </Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
            <h1 className="d-flex flex-nowrap  justify-content-center mt-4 align-items-center no-drag m-0 p-0">Used Resources</h1>
            <hr className="mb-0 pb-0 mx-3 mt-2"/>
            <div className="d-flex flex-wrap justify-content-center mt-0 pt-0">
                {Array.from(allResources).map((item, index) => (
                    <div key={index} style={{margin: '1.25rem'}}>
                        <ResourceCircle
                            amount={((resourceMap.get(item)?.input ?? 0) - (resourceMap.get(item)?.output ?? 0))}
                            itemClassName={item}
                        />
                    </div>
                ))}
            </div>
            <h1 className="d-flex flex-nowrap  justify-content-center mt-4 align-items-center no-drag mt-5">Item Usage</h1>
            <hr className="mb-4 pb-0 mx-3 mt-2"/>
            <div className="d-flex flex-wrap justify-content-center mt-0 pt-0">
                {Array.from(itemMap.entries()).map(([itemClassName, usageData], index) => (
                    <div key={index} className="m-2">
                        <ItemCard itemUsageData={usageData} itemClassName={itemClassName}/>
                    </div>
                ))}
            </div>
        </div>

    )
}
import { createFileRoute, Link } from '@tanstack/react-router'
import { FolderFill, ShareFill, Upload, EyeFill, PeopleFill, Diagram3Fill } from 'react-bootstrap-icons'
import BuyMeCoffeeWidget from "../components/BuyMeCoffeeButton.tsx";
import {useAuth0Context} from "../auth/useAuth0Context.ts";

export const Route = createFileRoute('/about')({
    component: RouteComponent,
    staticData: {
        showNav: true,
        title: "Ficsit Together | About",
        requireAuth: false
    }
})

type FeatureProps = {
    icon: React.ReactNode;
    title: string;
    description: string;
}

function Feature({ icon, title, description }: FeatureProps) {
    return (
        <div className="d-flex flex-column align-items-center text-center p-3" style={{ maxWidth: "220px" }}>
            <div className="mb-2 text-primary">{icon}</div>
            <h6 className="fw-semibold mb-1">{title}</h6>
            <p className="text-muted small mb-0">{description}</p>
        </div>
    );
}

function RouteComponent() {
    const auth = useAuth0Context();

    return (
        <>
            <BuyMeCoffeeWidget/>

            <div className="d-flex justify-content-center px-3" style={{ marginTop: "2vh" }}>
                <div style={{ maxWidth: "720px", width: "100%" }}>

                    <div className="text-center mb-4">
                        <h1 className="mb-2">Welcome to Ficsit Together</h1>
                        <p className="fs-5 mb-1">Yet another Satisfactory factory planner, but this time, together! (wow)</p>
                        <p className="text-muted">We got tired of using spreadsheets for live collaboration, so we made our own website.</p>

                        {(!auth || !auth.isAuthenticated) && <p className="text-muted">Ready to make an account? <Link to="/login" className="text-white clickable-link default-purple">Click here!</Link></p>}
                    </div>

                    <hr/>

                    <div className="text-center my-4">
                        <h5 className="mb-3 text-muted text-uppercase" style={{ letterSpacing: "0.05em", fontSize: "0.8rem" }}>What does it do?</h5>
                        <div className="d-flex flex-wrap justify-content-center gap-2">
                            <Feature
                                icon={<PeopleFill size={28} className={"default-orange"}/>}
                                title="Live collaboration"
                                description="Open the same project with multiple people and see each other's changes in real time."
                            />
                            <Feature
                                icon={<Diagram3Fill size={28} className={"default-orange"}/>}
                                title="Node-based editor"
                                description="Plan your factory by connecting recipe nodes, resource spawners and sinks together visually."
                            />
                            <Feature
                                icon={<FolderFill size={28} className={"default-orange"}/>}
                                title="Directories"
                                description="Organise your projects in folders however you like. Nest them as deep as you want."
                            />
                            <Feature
                                icon={<ShareFill size={28} className={"default-orange"}/>}
                                title="Sharing"
                                description="Share a directory with other users and collaborate on an entire folder of projects."
                            />
                            <Feature
                                icon={<EyeFill size={28} className={"default-orange"}/>}
                                title="Public links"
                                description="Share a directory for public viewing by anyone with the url, without showing your username."
                            />
                            <Feature
                                icon={<Upload size={28} className={"default-orange"}/>}
                                title="Export/Import"
                                description="Download or upload a .json file of any of your projects to share with others."
                            />
                        </div>
                    </div>

                    <hr/>

                    <div className="text-center my-4 text-muted">
                        <p>Check out <a href="https://ficsit-together.com/view/directories/5ea1a0e0-5239-42bc-b1ca-7d1f169a9f47" className="clickable-link default-purple">these</a> example projects!</p>
                    </div>

                    <hr/>

                    <div className="text-center mt-4 text-muted">
                        <p className="mb-1">This project is open source, <a href="https://github.com/erwtj/FicsitTogether" className="clickable-link default-purple">take a look on GitHub</a> if you're curious or want to contribute.</p>
                        <p className="mb-1">Heavily inspired by <a className="clickable-link default-purple" href="https://satisfactory-planner.vercel.app/">this planner</a>, which sadly doesn't seem to get updates anymore.</p>
                        <p className="mb-0 small text-body-tertiary">Ficsit Together is not affiliated with Coffee Stain Studios.</p>
                    </div>

                </div>
            </div>
        </>
    );
}



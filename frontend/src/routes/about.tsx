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
    },
    head: () => ({
        meta: [
            {
                name: 'description',
                content: 'Ficsit Together is a collaborative Satisfactory factory planner with real-time multiplayer. Design factories with friends using a node-based editor, share projects, and plan your production lines together.'
            },
            {
                name: 'keywords',
                content: 'Satisfactory, factory planner, multiplayer, collaboration, node editor, production planning, Satisfactory tools, game planner'
            },
            {
                property: 'og:title',
                content: 'Ficsit Together - Collaborative Satisfactory Factory Planner'
            },
            {
                property: 'og:description',
                content: 'Plan your Satisfactory factory with friends in real-time. Node-based editor, live collaboration, and project sharing for the ultimate factory planning experience.'
            },
            {
                property: 'og:type',
                content: 'website'
            },
            {
                property: 'og:url',
                content: 'https://ficsit-together.com/about'
            },
            {
                name: 'twitter:card',
                content: 'summary_large_image'
            },
            {
                name: 'twitter:title',
                content: 'Ficsit Together - Collaborative Satisfactory Factory Planner'
            },
            {
                name: 'twitter:description',
                content: 'Plan your Satisfactory factory with friends in real-time. Node-based editor, live collaboration, and project sharing.'
            }
        ]
    })
})

type FeatureProps = {
    icon: React.ReactNode;
    title: string;
    description: string;
}

function Feature({ icon, title, description }: FeatureProps) {
    return (
        <article className="d-flex flex-column align-items-center text-center p-3" style={{ maxWidth: "220px" }}>
            <div className="mb-2 text-primary" aria-hidden="true">{icon}</div>
            <h3 className="fw-semibold mb-1 h6">{title}</h3>
            <p className="text-muted small mb-0">{description}</p>
        </article>
    );
}

function RouteComponent() {
    const auth = useAuth0Context();

    return (
        <>
            <BuyMeCoffeeWidget/>

            <main className="d-flex justify-content-center px-3" style={{ marginTop: "2vh" }}>
                <div style={{ maxWidth: "720px", width: "100%" }}>

                    <header className="text-center mb-4">
                        <h1 className="mb-2">Welcome to Ficsit Together</h1>
                        <p className="fs-5 mb-2">Yet another Satisfactory factory planner, but this time, together! (wow)</p>
                        <p className="text-muted mb-0">Ficsit Together is a factory planner that allows you to design a factory with your friends.</p>
                        <p className="text-muted mb-0">Changes to a document are automatically saved and synchronized with other connected users, allowing for live collaboration.</p>

                        {(!auth || !auth.isAuthenticated) && <p className="text-muted">Ready to make an account? <Link to="/login" className="text-white clickable-link default-purple">Click here!</Link></p>}
                    </header>

                    <hr/>

                    <section className="text-center my-4" aria-labelledby="features-heading">
                        <h2 id="features-heading" className="mb-3 text-muted text-uppercase h5" style={{ letterSpacing: "0.05em", fontSize: "0.8rem" }}>What does it do?</h2>
                        <div className="d-flex flex-wrap justify-content-center gap-2" role="list">
                            <Feature
                                icon={<PeopleFill size={28} className={"default-orange-desaturated"}/>}
                                title="Live collaboration"
                                description="Open the same project with multiple people and see each other's changes in real time."
                            />
                            <Feature
                                icon={<Diagram3Fill size={28} className={"default-orange-desaturated"}/>}
                                title="Node-based editor"
                                description="Plan your factory by connecting recipe nodes, resource spawners and sinks together visually."
                            />
                            <Feature
                                icon={<FolderFill size={28} className={"default-orange-desaturated"}/>}
                                title="Directories"
                                description="Organise your projects in folders however you like. Nest them as deep as you want."
                            />
                            <Feature
                                icon={<ShareFill size={28} className={"default-orange-desaturated"}/>}
                                title="Sharing"
                                description="Share a directory with other users and collaborate on an entire folder of projects."
                            />
                            <Feature
                                icon={<EyeFill size={28} className={"default-orange-desaturated"}/>}
                                title="Public links"
                                description="Share a directory for public viewing by anyone with the url, without leaking your username."
                            />
                            <Feature
                                icon={<Upload size={28} className={"default-orange-desaturated"}/>}
                                title="Export/Import"
                                description="Download or upload a .json file of any of your projects to share with others."
                            />
                        </div>
                    </section>

                    <hr/>

                    <section className="text-center my-4" aria-labelledby="examples-heading">
                        <h2 id="examples-heading" className="visually-hidden">Example Projects</h2>
                        <p className="mb-1">What does it look like? Check out <a href="https://ficsit-together.com/view/directories/5ea1a0e0-5239-42bc-b1ca-7d1f169a9f47" className="clickable-link default-purple" aria-label="View example Satisfactory factory projects">these</a> example projects!</p>
                        <p className="text-muted">These are public projects, they can be viewed by anyone, but not edited. You can download them and upload them to your own folder if you want to edit them.</p>
                    </section>

                    <hr/>

                    <footer className="text-center mt-4 text-muted">
                        <p className="mb-1">This project is open source, <a href="https://github.com/erwtj/FicsitTogether" className="clickable-link default-purple" rel="noopener noreferrer" target="_blank">take a look on GitHub</a> if you're curious or want to contribute.</p>
                        <p className="mb-1">Inspired by <a className="clickable-link default-purple" href="https://satisfactory-planner.vercel.app/" rel="noopener noreferrer" target="_blank">this planner</a>, which sadly doesn't seem to get updates anymore.</p>
                        <p className="mb-0 small text-body-tertiary">Ficsit Together is not affiliated with Coffee Stain Studios.</p>
                    </footer>

                </div>
            </main>
        </>
    );
}



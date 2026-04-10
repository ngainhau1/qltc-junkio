export function TableSwitch({ mobile, desktop }) {
    return (
        <>
            <div className="md:hidden">{mobile}</div>
            <div className="hidden md:block">{desktop}</div>
        </>
    );
}

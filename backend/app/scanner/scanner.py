import nmap

def scan_network(target):
    scanner = nmap.PortScanner()

    scanner.scan(hosts=target, arguments="-sn")

    hosts = []

    for host in scanner.all_hosts():

        hosts.append({
            "ip": host,
            "status": scanner[host].state()
        })

    return {
        "target": target,
        "hosts": hosts
    }


def scan_ports(target):
    scanner = nmap.PortScanner()

    scanner.scan(
        hosts=target,
        arguments="-sV -O"
    )

    results = []

    for host in scanner.all_hosts():

        host_data = {
            "ip": host,
            "ports": [],
            "os": "Unknown"
        }

        # DETECCIÓN DE SISTEMA OPERATIVO
        if "osmatch" in scanner[host]:

            os_matches = scanner[host]["osmatch"]

            if len(os_matches) > 0:
                host_data["os"] = os_matches[0]["name"]

        # DETECCIÓN DE PUERTOS
        for protocol in scanner[host].all_protocols():

            ports = scanner[host][protocol].keys()

            for port in ports:

                port_info = scanner[host][protocol][port]

                host_data["ports"].append({
                    "port": port,
                    "state": port_info["state"],
                    "service": port_info["name"]
                })

        results.append(host_data)

    return {
        "target": target,
        "results": results
    }

